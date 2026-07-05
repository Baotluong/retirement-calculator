import { CompareScenarioLink } from "@/components/CompareScenarioLink";
import {
  formatScenarioCurrency,
  scenarioSummaryTooltips,
  type RetirementAgeProjectionStats,
  type ScenarioRetirementAgeDetails,
} from "@/lib/scenario-summary";

export type CompareRetirementAgeScenario = {
  id: number;
  name: string;
  details: ScenarioRetirementAgeDetails;
};


function formatGroupTitleWithAges(baseTitle: string, ages: number[]): string {
  if (ages.length === 0) {
    return baseTitle;
  }

  const sorted = [...ages].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return baseTitle + " (" + min + ")";
  }

  return baseTitle + " (" + min + "\u2013" + max + ")";
}

function formatScenarioColumnHeader(
  name: string,
  stats: RetirementAgeProjectionStats | null
): string {
  if (!stats) {
    return name;
  }

  return name + " (" + stats.retirementAge + ")";
}
type CompareRetirementAgeStatsTableProps = {
  scenarios: CompareRetirementAgeScenario[];
};

type MetricRow = {
  label: string;
  tooltip: string;
  getValue: (stats: RetirementAgeProjectionStats | null) => string;
};

const retirementMetricRows: MetricRow[] = [
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

const coastMetricRows: MetricRow[] = [
  {
    label: "Net worth at coast age",
    tooltip: scenarioSummaryTooltips.coastAgeNetWorth,
    getValue: (stats) =>
      stats ? formatScenarioCurrency(stats.netWorthAtRetirement) : "-",
  },
  {
    label: "Peak net worth",
    tooltip: scenarioSummaryTooltips.coastAgePeakNetWorth,
    getValue: (stats) => (stats ? formatScenarioCurrency(stats.peakNetWorth) : "-"),
  },
  {
    label: "Ending net worth",
    tooltip: scenarioSummaryTooltips.coastAgeEndingNetWorth,
    getValue: (stats) => (stats ? formatScenarioCurrency(stats.endingNetWorth) : "-"),
  },
];

function RetirementAgeGroupTable({
  title,
  scenarios,
  pickStats,
  metrics,
}: {
  title: string;
  scenarios: CompareRetirementAgeScenario[];
  pickStats: (details: ScenarioRetirementAgeDetails) => RetirementAgeProjectionStats | null;
  metrics: MetricRow[];
}) {
  const ages = scenarios
    .map((scenario) => pickStats(scenario.details)?.retirementAge ?? null)
    .filter((age): age is number => age !== null);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">
              {formatGroupTitleWithAges(title, ages)}
            </th>
            {scenarios.map((scenario) => (
              <th key={scenario.id} className="px-4 py-3 font-medium">
                <CompareScenarioLink
                  id={scenario.id}
                  label={formatScenarioColumnHeader(
                    scenario.name,
                    pickStats(scenario.details)
                  )}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.label} className="border-t border-zinc-100">
              <td className="px-4 py-3 text-zinc-600" title={metric.tooltip}>
                {metric.label}
              </td>
              {scenarios.map((scenario) => (
                <td
                  key={scenario.id + "-" + metric.label}
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
        metrics={retirementMetricRows}
      />
      <RetirementAgeGroupTable
        title="Safe retirement age"
        scenarios={scenarios}
        pickStats={(details) => details.safe}
        metrics={retirementMetricRows}
      />
      <RetirementAgeGroupTable
        title="Coast FIRE age"
        scenarios={scenarios}
        pickStats={(details) => details.coast}
        metrics={coastMetricRows}
      />
      <RetirementAgeGroupTable
        title="Retire at 50"
        scenarios={scenarios}
        pickStats={(details) => details.retireAt50}
        metrics={retirementMetricRows}
      />
    </div>
  );
}
