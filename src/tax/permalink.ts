const BASE_URL = "https://thetax.nl/";

export interface PermalinkParams {
  year: number;
  startFrom: "Year" | "Month" | "Week" | "Day" | "Hour";
  salary: number;
  allowance: boolean;
  socialSecurity: boolean;
  older: boolean;
  ruling: { checked: boolean; choice?: string };
}

/** Builds a link to the equivalent scenario on the public thetax.nl calculator. */
export function buildPermalink(params: PermalinkParams): string {
  const search = new URLSearchParams({
    year: String(params.year),
    startFrom: params.startFrom,
    salary: String(params.salary),
    allowance: String(params.allowance),
    socialSecurity: String(params.socialSecurity),
    retired: String(params.older),
    ruling: String(params.ruling.checked),
    rulingChoice: params.ruling.checked ? (params.ruling.choice ?? "") : "",
  });
  return `${BASE_URL}?${search.toString()}`;
}
