import { describe, expect, it } from "vitest";
import { buildAssumptions, buildBreakdown, DISCLAIMER } from "../src/tax/breakdown";
import { runSalaryPaycheck } from "../src/tax/paycheck";

describe("buildBreakdown", () => {
  it("returns the four documented lines with year and month amounts", () => {
    const paycheck = runSalaryPaycheck({
      year: 2026,
      income: 36000,
      startFrom: "Year",
      allowance: false,
      socialSecurity: true,
      older: false,
      hours: 40,
      ruling: { checked: false },
    });

    const breakdown = buildBreakdown(paycheck);
    expect(breakdown.map((b) => b.label)).toEqual([
      "Payroll tax (loonbelasting)",
      "Social security contributions (volksverzekeringen)",
      "General tax credit (algemene heffingskorting)",
      "Labour tax credit (arbeidskorting)",
    ]);
    expect(breakdown[0]!.amountYear).toBe(paycheck.payrollTax);
    expect(breakdown[1]!.amountYear).toBe(paycheck.socialTax);
    expect(breakdown[2]!.amountYear).toBe(paycheck.generalCredit);
    expect(breakdown[3]!.amountYear).toBe(paycheck.labourCredit);
  });
});

describe("buildAssumptions", () => {
  it("always leads with the indicative / not-tax-advice disclaimer", () => {
    const assumptions = buildAssumptions({
      year: 2026,
      allowance: false,
      socialSecurity: true,
      older: false,
      hours: 40,
      ruling: { checked: false },
    });
    expect(assumptions[0]).toBe(DISCLAIMER);
    expect(DISCLAIMER.toLowerCase()).toContain("not tax advice");
  });

  it("describes the 30% ruling choice when checked", () => {
    const assumptions = buildAssumptions({
      year: 2026,
      allowance: false,
      socialSecurity: true,
      older: false,
      hours: 40,
      ruling: { checked: true, choice: "young" },
    });
    expect(assumptions.some((line) => line.includes("'young'"))).toBe(true);
  });
});
