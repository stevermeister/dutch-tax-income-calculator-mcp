import type { SalaryPaycheck } from "dutch-tax-income-calculator";

export interface ComparisonRow {
  index: number;
  label: string;
  year: number;
  grossYear: number;
  netYear: number;
  netMonth: number;
  incomeTax: number;
  effectiveTaxRatePercent: number;
}

export function buildComparisonRow(
  index: number,
  label: string | undefined,
  year: number,
  paycheck: SalaryPaycheck
): ComparisonRow {
  const effectiveTaxRatePercent =
    paycheck.grossYear > 0 ? Number(((-paycheck.incomeTax / paycheck.grossYear) * 100).toFixed(2)) : 0;
  return {
    index,
    label: label ?? `Scenario ${index}`,
    year,
    grossYear: paycheck.grossYear,
    netYear: paycheck.netYear,
    netMonth: paycheck.netMonth,
    incomeTax: paycheck.incomeTax,
    effectiveTaxRatePercent,
  };
}

export function buildComparisonTable(rows: ComparisonRow[]): string {
  const header = "| # | Label | Year | Gross/yr | Net/yr | Net/mo | Income tax | Effective tax rate |";
  const separator = "|---|---|---|---|---|---|---|---|";
  const lines = rows.map(
    (row) =>
      `| ${row.index} | ${row.label} | ${row.year} | €${row.grossYear.toFixed(2)} | €${row.netYear.toFixed(2)} | €${row.netMonth.toFixed(2)} | €${row.incomeTax.toFixed(2)} | ${row.effectiveTaxRatePercent}% |`
  );
  return [header, separator, ...lines].join("\n");
}
