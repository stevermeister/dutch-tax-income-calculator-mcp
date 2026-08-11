import { constants } from "dutch-tax-income-calculator";

export class UnsupportedYearError extends Error {
  readonly year: number;
  readonly supportedYears: number[];

  constructor(year: number, supportedYears: number[] = constants.years) {
    super(
      `Unsupported tax year ${year}. This server only supports years present in dutch-tax-income-calculator's data.json: ${supportedYears.join(", ")}.`
    );
    this.name = "UnsupportedYearError";
    this.year = year;
    this.supportedYears = supportedYears;
  }
}

export function assertSupportedYear(year: number): void {
  if (!Number.isInteger(year) || !constants.years.includes(year)) {
    throw new UnsupportedYearError(year, constants.years);
  }
}

export function supportedYears(): number[] {
  return constants.years;
}
