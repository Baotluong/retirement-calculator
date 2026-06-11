import {
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

const metricRows: {
  key: keyof ScenarioSummaryStats;
  label: string;
  format: (value: number | null) => string;
}[] = [
  {
    key: "earliestRetirementAge",
    label: "Earliest retirement age",
    format: (value) => (value === null ? "—" : String(value)),
  },
  {
    key: "netWorthAtRetirement",
    label: "Net worth at retirement",
    format: (value) => formatScenarioCurrency(value ?? 0),
  },
  {
    key: "netWorthAtLifeExpectancy",
    label: "Net worth at life expectancy",
    format: (value) => formatScenarioCurrency(value ?? 0),
  },
  {
    key: "annualTakehome",
    label: "Annual takehome",
    format: (value) => formatScenarioCurrency(value ?? 0),
  },
  {
    key: "annualContributions",
    label: "Annual contributions",
    format: (value) => formatScenarioCurrency(value ?? 0),
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
              <td className="px-4 py-3 text-zinc-600" title={scenarioSummaryTooltips[metric.key]}>
                {metric.label}
              </td>
              {scenarios.map((scenario) => (
                <td key={scenario.name + metric.key} className="px-4 py-3 font-medium text-zinc-900">
                  {metric.format(scenario.stats[metric.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
