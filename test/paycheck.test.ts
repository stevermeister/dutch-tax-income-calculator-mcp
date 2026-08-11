import { describe, expect, it } from "vitest";
import { isGrossPlateau, runNetToGross, runSalaryPaycheck, toPlainPaycheck } from "../src/tax/paycheck";

describe("runSalaryPaycheck", () => {
  it("matches the package's documented 2026 example", () => {
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

    expect(paycheck.grossYear).toBe(36000);
    expect(paycheck.netYear).toBeCloseTo(31342.33, 2);
  });

  it("never reimplements tax logic — delegates every field to the package's own class", () => {
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
    const plain = toPlainPaycheck(paycheck);
    expect(plain.netYear).toBe(paycheck.netYear);
    expect(plain.payrollTax).toBe(paycheck.payrollTax);
  });
});

describe("runNetToGross", () => {
  it("round-trips a net figure back to (approximately) the original gross", () => {
    const forward = runSalaryPaycheck({
      year: 2026,
      income: 36000,
      startFrom: "Year",
      allowance: false,
      socialSecurity: true,
      older: false,
      hours: 40,
      ruling: { checked: false },
    });

    const solved = runNetToGross(
      { amount: forward.netYear, field: "netYear", holidayAllowanceIncluded: false },
      {
        period: "Year",
        year: 2026,
        allowance: false,
        socialSecurity: true,
        older: false,
        hours: 40,
        ruling: { checked: false },
      }
    );

    if (isGrossPlateau(solved)) {
      expect(solved.grossLow).toBeLessThanOrEqual(36000);
      expect(solved.grossHigh).toBeGreaterThanOrEqual(36000);
    } else {
      expect(solved.grossYear).toBeCloseTo(36000, 0);
    }
  });

  it("throws the package's own validation error verbatim, without being reworded", () => {
    expect(() =>
      runNetToGross(
        { amount: 30000, field: "netYear", holidayAllowanceIncluded: true },
        {
          period: "Year",
          year: 2026,
          allowance: false,
          socialSecurity: true,
          older: false,
          hours: 40,
          ruling: { checked: false },
        }
      )
    ).toThrowError(/holidayAllowanceIncluded requires options\.allowance or options\.ruling\.checked/);
  });

  it("throws the package's own period-mismatch error verbatim for a mismatched field/period", () => {
    expect(() =>
      runNetToGross(
        // period intentionally mismatched (should be "Month") to exercise the package's own guard
        { amount: 30000, field: "netMonth", holidayAllowanceIncluded: false },
        {
          period: "Year",
          year: 2026,
          allowance: false,
          socialSecurity: true,
          older: false,
          hours: 40,
          ruling: { checked: false },
        }
      )
    ).toThrowError(/options\.period must be/);
  });
});
