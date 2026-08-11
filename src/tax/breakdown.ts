import type { SalaryPaycheck } from "dutch-tax-income-calculator";

export interface BreakdownLine {
  label: string;
  amountYear: number;
  amountMonth: number;
}

/** Payroll tax, social security, general credit and labour credit lines from a computed paycheck. */
export function buildBreakdown(paycheck: SalaryPaycheck): BreakdownLine[] {
  return [
    {
      label: "Payroll tax (loonbelasting)",
      amountYear: paycheck.payrollTax,
      amountMonth: paycheck.payrollTaxMonth,
    },
    {
      label: "Social security contributions (volksverzekeringen)",
      amountYear: paycheck.socialTax,
      amountMonth: paycheck.socialTaxMonth,
    },
    {
      label: "General tax credit (algemene heffingskorting)",
      amountYear: paycheck.generalCredit,
      amountMonth: paycheck.generalCreditMonth,
    },
    {
      label: "Labour tax credit (arbeidskorting)",
      amountYear: paycheck.labourCredit,
      amountMonth: paycheck.labourCreditMonth,
    },
  ];
}

export interface AssumptionsInput {
  year: number;
  allowance: boolean;
  socialSecurity: boolean;
  older: boolean;
  hours: number;
  ruling: { checked: boolean; choice?: string };
}

const DISCLAIMER =
  "This result is indicative only and is not tax advice — confirm with a qualified Dutch tax advisor or the Belastingdienst before acting on it.";

export function buildAssumptions(input: AssumptionsInput): string[] {
  return [
    DISCLAIMER,
    `Tax tables for ${input.year} from the dutch-tax-income-calculator package (Belastingdienst payroll tax rules) were used; all internal amounts are rounded to 2 decimal places.`,
    `Holiday allowance (vakantiegeld, 8%) is treated as ${input.allowance ? "included in" : "excluded from"} the stated income.`,
    `Dutch social security contributions (AOW/Anw/Wlz) are ${input.socialSecurity ? "included" : "excluded"}.`,
    `Calculation ${input.older ? "assumes" : "does not assume"} the person has reached state pension (AOW) age.`,
    `Assumes ${input.hours} contracted hours per week.`,
    input.ruling.checked
      ? `The 30% ruling (30%-regeling) is applied using the '${input.ruling.choice ?? "normal"}' threshold.`
      : "The 30% ruling (30%-regeling) is not applied.",
  ];
}

export { DISCLAIMER };
