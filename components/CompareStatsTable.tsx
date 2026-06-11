import {
  formatSafeRetirementAgeTooltip,
  formatScenarioCurrency,
  scenarioSummaryTooltips,
  type ScenarioSummaryStats,
} from "@/lib/scenario-summary";

export type CompareScenarioRow = {
  name: string;
  stats: ScenarioSummaryStats;
};

type CompareStatsTableProps = {
  scenarios: CompareScenarioRow[];
};

type MetricRow = {
  key: keyof ScenarioSummaryStats;
  label: string;
  format: (value: number | null) => string;
  getLabelTooltip?: () => string;
  getCellTooltip?: (stats: ScenarioSummaryStats) => string;
};

const metricRows: MetricRow[] = [
  {
    key: "earliestRetirementAge",
    label: "Earliest retirement age",
    format: (value) => (value === null ? "-" : String(value)),
    getLabelTooltip: () => scenarioSummaryTooltips.earliestRetirementAge,
  },
  {
    key: "safeRetirementAge",
    label: "Safe retirement age",
    format: (value) => (value === null ? "-" : String(value)),
    getCellTooltip: (stats) => formatSafeRetirementAgeTooltip(stats.safeRetirementAmount),
  },
  {
    key: "netWorthAtRetirement",
    label: "Net worth at retirement",
    format: (value) => formatScenarioCurrency(value ?? 0),
    getLabelTooltip: () => scenarioSummaryTooltips.netWorthAtRetirement,
  },
  {
    key: "netWorthAtLifeExpectancy",
    label: "Net worth at life expectancy",
    format: (value) => formatScenarioCurrency(value ?? 0),
    getLabelTooltip: () => scenarioSummaryTooltips.netWorthAtLifeExpectancy,
  },
  {
    key: "annualTakehome",
    label: "Annual takehome",
    format: (value) => formatScenarioCurrency(value ?? 0),
    getLabelTooltip: () => scenarioSummaryTooltips.annualTakehome,
  },
  {
    key: "annualContributions",
    label: "Annual contributions",
    format: (value) => formatScenarioCurrency(value ?? 0),
    getLabelTooltip: () => scenarioSummaryTooltips.annualContributions,
  },
];

export function CompareStatsTable({ scenarios }: CompareStatsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">Metric</th>
            {scenarios.map((scenario) => (
              <th key={scenario.name} className="px-4 py-3 font-medium">
                {scenario.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricRows.map((metric) => (
            <tr key={metric.key} className="border-t border-zinc-100">
              <td
                className="px-4 py-3 text-zinc-600"
                title={metric.getLabelTooltip?.()}
              >
                {metric.label}
              </td>
              {scenarios.map((scenario) => (
                <td
                  key={scenario.name + metric.key}
                  className="px-4 py-3 font-medium text-zinc-900"
                  title={metric.getCellTooltip?.(scenario.stats)}
                >
                  {metric.format(scenario.stats[metric.key] as number | null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}