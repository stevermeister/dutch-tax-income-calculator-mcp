import { McpServer, ResourceTemplate, type CallToolResult } from "@modelcontextprotocol/server";
import { constants } from "dutch-tax-income-calculator";

import {
  CalculateNetSalaryInput,
  CalculateGrossFromNetInput,
  CompareScenariosInput,
} from "./tax/schemas";
import { assertSupportedYear, UnsupportedYearError } from "./tax/years";
import { buildBreakdown, buildAssumptions, DISCLAIMER } from "./tax/breakdown";
import { buildPermalink } from "./tax/permalink";
import { buildComparisonRow, buildComparisonTable, type ComparisonRow } from "./tax/compare";
import { runSalaryPaycheck, runNetToGross, toPlainPaycheck, isGrossPlateau } from "./tax/paycheck";

const NOT_TAX_ADVICE = "Indicative only — not tax advice.";

// All three tools are pure, deterministic calculations over the request's own
// input — no writes, no side effects, same input always yields the same
// output, and no interaction with an open/unpredictable external world.
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function toolError(err: unknown): CallToolResult {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: message }], isError: true };
}

function jsonResult(payload: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dutch-tax-income-calculator-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "calculate_net_salary",
    {
      title: "Calculate net salary",
      description:
        `Calculate net Dutch salary from gross income for a given tax year, using the dutch-tax-income-calculator ` +
        `package's official Belastingdienst payroll tax tables (SalaryPaycheck). ${NOT_TAX_ADVICE}`,
      inputSchema: CalculateNetSalaryInput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        assertSupportedYear(args.year);
      } catch (err) {
        return toolError(err);
      }

      const paycheck = runSalaryPaycheck(args);

      return jsonResult({
        normalizedInput: args,
        result: toPlainPaycheck(paycheck),
        breakdown: buildBreakdown(paycheck),
        assumptions: buildAssumptions(args),
        permalink: buildPermalink({
          year: args.year,
          startFrom: args.startFrom,
          salary: args.income,
          allowance: args.allowance,
          socialSecurity: args.socialSecurity,
          older: args.older,
          ruling: args.ruling,
        }),
      });
    }
  );

  server.registerTool(
    "calculate_gross_from_net",
    {
      title: "Calculate gross from net (reverse)",
      description:
        `Given a target net Dutch salary, find the gross salary that produces it, using the ` +
        `dutch-tax-income-calculator package's netToGross solver (never reimplemented locally). Because every ` +
        `internal amount is rounded to 2 decimals, more than one gross can round to the same net — in that case ` +
        `the package's exact plateau bounds (grossLow/grossHigh) are returned verbatim instead of a single value. ` +
        `If no gross produces the target net, the package's "no solution" error message is returned verbatim. ${NOT_TAX_ADVICE}`,
      inputSchema: CalculateGrossFromNetInput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        assertSupportedYear(args.year);
      } catch (err) {
        return toolError(err);
      }

      const period: "Year" | "Month" = args.field === "netYear" ? "Year" : "Month";

      let solved;
      try {
        solved = runNetToGross(
          {
            amount: args.targetNet,
            field: args.field,
            holidayAllowanceIncluded: args.holidayAllowanceIncluded,
          },
          {
            period,
            year: args.year,
            allowance: args.allowance,
            socialSecurity: args.socialSecurity,
            older: args.older,
            hours: args.hours,
            ruling: args.ruling,
          }
        );
      } catch (err) {
        // The package's own plateau/no-solution error, surfaced verbatim — not reworded.
        return toolError(err);
      }

      const assumptions = buildAssumptions(args);
      const normalizedInput = args;

      if (isGrossPlateau(solved)) {
        assumptions.push(
          `Rounding to 2 decimals means more than one gross value produces this net income; every gross ` +
            `${period === "Year" ? "per year" : "per month"} between grossLow and grossHigh (inclusive) rounds ` +
            `to the requested net. These bounds are the package's own, unaltered.`
        );
        const paycheckAtHigh = runSalaryPaycheck({
          year: args.year,
          income: solved.grossHigh,
          startFrom: period,
          allowance: args.allowance,
          socialSecurity: args.socialSecurity,
          older: args.older,
          hours: args.hours,
          ruling: args.ruling,
        });

        return jsonResult({
          normalizedInput,
          result: { plateau: true, grossLow: solved.grossLow, grossHigh: solved.grossHigh },
          breakdown: buildBreakdown(paycheckAtHigh),
          assumptions,
          permalink: buildPermalink({
            year: args.year,
            startFrom: period,
            salary: solved.grossHigh,
            allowance: args.allowance,
            socialSecurity: args.socialSecurity,
            older: args.older,
            ruling: args.ruling,
          }),
        });
      }

      const salary = period === "Year" ? solved.grossYear : solved.grossMonth;

      return jsonResult({
        normalizedInput,
        result: toPlainPaycheck(solved),
        breakdown: buildBreakdown(solved),
        assumptions,
        permalink: buildPermalink({
          year: args.year,
          startFrom: period,
          salary,
          allowance: args.allowance,
          socialSecurity: args.socialSecurity,
          older: args.older,
          ruling: args.ruling,
        }),
      });
    }
  );

  server.registerTool(
    "compare_scenarios",
    {
      title: "Compare salary scenarios",
      description:
        `Compare 2-5 Dutch net-salary scenarios side by side (e.g. different years, hours, or 30% ruling status), ` +
        `each computed with the dutch-tax-income-calculator package. Returns a per-scenario breakdown plus a ` +
        `comparison table. ${NOT_TAX_ADVICE}`,
      inputSchema: CompareScenariosInput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const rows: ComparisonRow[] = [];
      const scenarios: unknown[] = [];

      for (const [i, scenario] of args.scenarios.entries()) {
        const index = i + 1;
        try {
          assertSupportedYear(scenario.year);
        } catch (err) {
          return toolError(err);
        }

        const paycheck = runSalaryPaycheck(scenario);
        rows.push(buildComparisonRow(index, scenario.label, scenario.year, paycheck));
        scenarios.push({
          index,
          label: scenario.label ?? `Scenario ${index}`,
          normalizedInput: scenario,
          result: toPlainPaycheck(paycheck),
          breakdown: buildBreakdown(paycheck),
          assumptions: buildAssumptions(scenario),
          permalink: buildPermalink({
            year: scenario.year,
            startFrom: scenario.startFrom,
            salary: scenario.income,
            allowance: scenario.allowance,
            socialSecurity: scenario.socialSecurity,
            older: scenario.older,
            ruling: scenario.ruling,
          }),
        });
      }

      return jsonResult({
        assumptions: [DISCLAIMER],
        scenarios,
        comparisonTable: buildComparisonTable(rows),
      });
    }
  );

  server.registerResource(
    "tax-brackets",
    new ResourceTemplate("tax://brackets/{year}", { list: undefined }),
    {
      title: "Dutch tax brackets and thresholds",
      description:
        "Payroll tax, social security, general credit and labour credit brackets, plus 30% ruling thresholds, " +
        "for a given Dutch tax year — read directly from dutch-tax-income-calculator's data.json.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const rawYear = Array.isArray(variables.year) ? variables.year[0] : variables.year;
      const year = Number(rawYear);
      assertSupportedYear(year); // Throws UnsupportedYearError -> surfaced as a resource read error, never a silent fallback.

      const body = {
        year,
        workingWeeks: constants.workingWeeks,
        workingDays: constants.workingDays,
        defaultWorkingHours: constants.defaultWorkingHours,
        rulingThreshold: constants.rulingThreshold[year],
        rulingMaxSalary: constants.rulingMaxSalary[year],
        lowWageThreshold: constants.lowWageThreshold[year],
        payrollTax: constants.payrollTax[year],
        socialPercent: constants.socialPercent[year],
        generalCredit: constants.generalCredit[year],
        labourCredit: constants.labourCredit[year],
      };

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(body, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

export { UnsupportedYearError };
