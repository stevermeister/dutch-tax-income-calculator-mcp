import { z } from "zod";

export const StartFromSchema = z.enum(["Year", "Month", "Week", "Day", "Hour"]);
export const NetFieldSchema = z.enum(["netYear", "netMonth"]);
export const RulingChoiceSchema = z.enum(["normal", "young", "research"]);

export const RulingSchema = z
  .object({
    checked: z
      .boolean()
      .default(false)
      .describe("Whether the 30% ruling (30%-regeling) applies"),
    choice: RulingChoiceSchema.optional().describe(
      "Required when checked=true: 'normal' | 'young' (Master's degree, under 30) | 'research' (scientific research worker)"
    ),
  })
  .default({ checked: false })
  .describe("30% ruling (30%-regeling) settings");

const CommonSalaryFieldsShape = {
  year: z
    .number()
    .int()
    .describe("Dutch tax year, e.g. 2026. Must be a year present in the package's data.json — see the tax://brackets/{year} resource for supported years."),
  allowance: z
    .boolean()
    .default(false)
    .describe("Whether the income figure already includes the 8% holiday allowance (vakantiegeld)"),
  socialSecurity: z
    .boolean()
    .default(true)
    .describe("Whether Dutch social security contributions (AOW/Anw/Wlz) apply"),
  older: z.boolean().default(false).describe("Whether the person has reached state pension (AOW) age"),
  hours: z.number().positive().default(40).describe("Contracted hours per week"),
  ruling: RulingSchema,
};

export const CalculateNetSalaryInputShape = {
  ...CommonSalaryFieldsShape,
  income: z.number().positive().describe("Gross income, denominated in the unit given by startFrom"),
  startFrom: StartFromSchema.default("Year").describe("Which unit `income` is expressed in"),
};

export const CalculateNetSalaryInput = z.object(CalculateNetSalaryInputShape);

export const CalculateGrossFromNetInputShape = {
  ...CommonSalaryFieldsShape,
  targetNet: z.number().positive().describe("Target net income to solve for"),
  field: NetFieldSchema.default("netYear").describe(
    "Which net figure targetNet refers to: netYear (annual) or netMonth (monthly)"
  ),
  holidayAllowanceIncluded: z
    .boolean()
    .default(false)
    .describe("Whether targetNet already includes the net holiday allowance payout"),
};

export const CalculateGrossFromNetInput = z.object(CalculateGrossFromNetInputShape);

const ScenarioSchema = z.object({
  ...CalculateNetSalaryInputShape,
  label: z
    .string()
    .min(1)
    .max(80)
    .optional()
    .describe("Optional label to identify this scenario in the comparison table"),
});

export const CompareScenariosInputShape = {
  scenarios: z
    .array(ScenarioSchema)
    .min(2)
    .max(5)
    .describe("Between 2 and 5 salary scenarios to compare, each shaped like calculate_net_salary's input"),
};

export const CompareScenariosInput = z.object(CompareScenariosInputShape);

export type CalculateNetSalaryArgs = z.infer<typeof CalculateNetSalaryInput>;
export type CalculateGrossFromNetArgs = z.infer<typeof CalculateGrossFromNetInput>;
export type CompareScenariosArgs = z.infer<typeof CompareScenariosInput>;
export type ScenarioArgs = z.infer<typeof ScenarioSchema>;
