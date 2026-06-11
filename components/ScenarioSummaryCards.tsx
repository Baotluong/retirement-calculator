import { InfoTooltip } from "@/components/InfoTooltip";
import {
  formatScenarioCurrency,
  scenarioSummaryTooltips,
  type ScenarioSummaryStats,
} from "@/lib/scenario-summary";

type ScenarioSummaryCardsProps = ScenarioSummaryStats;

type SummaryCardProps = {
  label: string;
  value: string;
  tooltip: string;
};

function SummaryCard({ label, value, tooltip }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
        {label}
        <InfoTooltip text={tooltip} />
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export function ScenarioSummaryCards({
  earliestRetirementAge,
  netWorthAtRetirement,
  netWorthAtLifeExpectancy,
  annualTakehome,
  annualContributions,
}: ScenarioSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <SummaryCard
        label="Earliest retirement age"
        value={earliestRetirementAge === null ? "—" : String(earliestRetirementAge)}
        tooltip={scenarioSummaryTooltips.earliestRetirementAge}
      />
      <SummaryCard
        label="Net worth at retirement"
        value={formatScenarioCurrency(netWorthAtRetirement)}
        tooltip={scenarioSummaryTooltips.netWorthAtRetirement}
      />
      <SummaryCard
        label="Net worth at life expectancy"
        value={formatScenarioCurrency(netWorthAtLifeExpectancy)}
        tooltip={scenarioSummaryTooltips.netWorthAtLifeExpectancy}
      />
      <SummaryCard
        label="Annual takehome"
        value={formatScenarioCurrency(annualTakehome)}
        tooltip={scenarioSummaryTooltips.annualTakehome}
      />
      <SummaryCard
        label="Annual contributions"
        value={formatScenarioCurrency(annualContributions)}
        tooltip={scenarioSummaryTooltips.annualContributions}
      />
    </div>
  );
}
