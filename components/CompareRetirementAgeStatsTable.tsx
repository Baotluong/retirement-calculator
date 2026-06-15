import {
  formatScenarioCurrency,
  scenarioSummaryTooltips,
  type RetirementAgeProjectionStats,
  type ScenarioRetirementAgeDetails,
} from "@/lib/scenario-summary";

export type CompareRetirementAgeScenario = {
  name: string;
  details: ScenarioRetirementAgeDetails;
};

type CompareRetirementAgeStatsTableProps = {
  scenarios: CompareRetirementAgeScenario[];
};

type MetricRow = {
  label: string;
  tooltip: string;
  getValue: (stats: RetirementAgeProjectionStats | null) => string;
};

const metricRows: MetricRow[] = [
  {
    label: "Net worth at retirement",
    tooltip: scenarioSummaryTooltips.retirementAgeNetWorth,
    getValue: (stats) =>
      stats ? formatScenarioCurrency(stats.netWorthAtRetirement) : "-",
  },
  {
    label: "Peak net worth",
    tooltip: scenarioSummaryTooltips.retirementAgePeakNetWorth,
    getValue: (stats) => (stats ? formatScenarioCurrency(stats.peakNetWorth) : "-"),
  },
  {
    label: "Ending net worth",
    tooltip: scenarioSummaryTooltips.retirementAgeEndingNetWorth,
    getValue: (stats) => (stats ? formatScenarioCurrency(stats.endingNetWorth) : "-"),
  },
];

function RetirementAgeGroupTable({
  title,
  scenarios,
  pickStats,
}: {
  title: string;
  scenarios: CompareRetirementAgeScenario[];
  pickStats: (details: ScenarioRetirementAgeDetails) => RetirementAgeProjectionStats | null;
}) {
  const ages = scenarios
    .map((scenario) => pickStats(scenario.details)?.retirementAge ?? null)
    .filter((age): age is number => age !== null);
  const ageSuffix =
    ages.length > 0 && new Set(ages).size === 1 ? " (" + ages[0] + ")" : "";

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">{title + ageSuffix}</th>
            {scenarios.map((scenario) => (
              <th key={scenario.name} className="px-4 py-3 font-medium">
                {scenario.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricRows.map((metric) => (
            <tr key={metric.label} className="border-t border-zinc-100">
              <td className="px-4 py-3 text-zinc-600" title={metric.tooltip}>
                {metric.label}
              </td>
              {scenarios.map((scenario) => (
                <td
                  key={scenario.name + metric.label}
                  className="px-4 py-3 font-medium text-zinc-900"
                >
                  {metric.getValue(pickStats(scenario.details))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompareRetirementAgeStatsTable({
  scenarios,
}: CompareRetirementAgeStatsTableProps) {
  return (
    <div className="space-y-4">
      <RetirementAgeGroupTable
        title="Earliest retirement age"
        scenarios={scenarios}
        pickStats={(details) => details.earliest}
      />
      <RetirementAgeGroupTable
        title="Safe retirement age"
        scenarios={scenarios}
        pickStats={(details) => details.safe}
      />
    </div>
  );
}
