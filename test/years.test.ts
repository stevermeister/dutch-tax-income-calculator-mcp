import { describe, expect, it } from "vitest";
import { constants } from "dutch-tax-income-calculator";
import { assertSupportedYear, supportedYears, UnsupportedYearError } from "../src/tax/years";

describe("years", () => {
  it("accepts a year present in the package's data.json", () => {
    const [firstYear] = supportedYears();
    expect(() => assertSupportedYear(firstYear!)).not.toThrow();
  });

  it("rejects an unsupported year with a clear, specific error — no silent fallback", () => {
    expect(() => assertSupportedYear(1899)).toThrow(UnsupportedYearError);
    try {
      assertSupportedYear(1899);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedYearError);
      const e = err as UnsupportedYearError;
      expect(e.year).toBe(1899);
      expect(e.message).toContain("1899");
      expect(e.message).toContain(constants.years.join(", "));
    }
  });

  it("rejects non-integer years", () => {
    expect(() => assertSupportedYear(2026.5)).toThrow(UnsupportedYearError);
  });
});
