import {
  SalaryPaycheck,
  netToGross,
  type RulingInput,
  type NetToGrossTarget,
  type NetToGrossOptions,
  type GrossPlateau,
} from "dutch-tax-income-calculator";

export interface NormalizedSalaryInput {
  year: number;
  income: number;
  startFrom: "Year" | "Month" | "Week" | "Day" | "Hour";
  allowance: boolean;
  socialSecurity: boolean;
  older: boolean;
  hours: number;
  ruling: RulingInput;
}

/** Runs the package's forward (gross -> net) calculation. Never reimplements bracket logic. */
export function runSalaryPaycheck(input: NormalizedSalaryInput): SalaryPaycheck {
  return new SalaryPaycheck(
    {
      income: input.income,
      allowance: input.allowance,
      socialSecurity: input.socialSecurity,
      older: input.older,
      hours: input.hours,
    },
    input.startFrom,
    input.year,
    input.ruling
  );
}

/** Plain, JSON-serializable copy of a SalaryPaycheck's own enumerable fields. */
export function toPlainPaycheck(paycheck: SalaryPaycheck): Record<string, number> {
  return { ...paycheck };
}

/** Runs the package's reverse (net -> gross) solver. Never reimplements it numerically. */
export function runNetToGross(
  target: NetToGrossTarget,
  options: NetToGrossOptions
): SalaryPaycheck | GrossPlateau {
  return netToGross(target, options);
}

export function isGrossPlateau(result: SalaryPaycheck | GrossPlateau): result is GrossPlateau {
  return !("netYear" in result);
}
