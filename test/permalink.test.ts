import { describe, expect, it } from "vitest";
import { buildPermalink } from "../src/tax/permalink";

describe("buildPermalink", () => {
  it("builds a thetax.nl link with all documented query params", () => {
    const url = buildPermalink({
      year: 2026,
      startFrom: "Year",
      salary: 36000,
      allowance: false,
      socialSecurity: true,
      older: false,
      ruling: { checked: false },
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://thetax.nl/");
    expect(parsed.searchParams.get("year")).toBe("2026");
    expect(parsed.searchParams.get("startFrom")).toBe("Year");
    expect(parsed.searchParams.get("salary")).toBe("36000");
    expect(parsed.searchParams.get("allowance")).toBe("false");
    expect(parsed.searchParams.get("socialSecurity")).toBe("true");
    expect(parsed.searchParams.get("retired")).toBe("false");
    expect(parsed.searchParams.get("ruling")).toBe("false");
    expect(parsed.searchParams.get("rulingChoice")).toBe("");
  });

  it("includes rulingChoice only in meaning when ruling is checked", () => {
    const url = buildPermalink({
      year: 2026,
      startFrom: "Year",
      salary: 50000,
      allowance: false,
      socialSecurity: true,
      older: false,
      ruling: { checked: true, choice: "research" },
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("ruling")).toBe("true");
    expect(parsed.searchParams.get("rulingChoice")).toBe("research");
  });
});
