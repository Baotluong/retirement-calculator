import { InfoTooltip } from "@/components/InfoTooltip";
import {
  formatSafeRetirementAgeTooltip,
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
    <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="inline-flex min-w-0 items-center gap-1.5 text-xs text-zinc-500 sm:text-sm">
        <span className="truncate">{label}</span>
        <InfoTooltip text={tooltip} />
      </p>
      <p className="mt-1.5 truncate text-lg font-semibold tabular-nums text-zinc-900 sm:mt-2 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

export function ScenarioSummaryCards({
  earliestRetirementAge,
  safeRetirementAge,
  coastFireAge,
  safeRetirementAmount,
  netWorthAtRetirement,
  netWorthAtLifeExpectancy,
  annualTakehome,
  annualContributions,
}: ScenarioSummaryCardsProps) {
  const safeRetirementTooltip = formatSafeRetirementAgeTooltip(safeRetirementAmount);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Earliest retirement age"
          value={earliestRetirementAge === null ? "-" : String(earliestRetirementAge)}
          tooltip={scenarioSummaryTooltips.earliestRetirementAge}
        />
        <SummaryCard
          label="Safe retirement age"
          value={safeRetirementAge === null ? "-" : String(safeRetirementAge)}
          tooltip={safeRetirementTooltip}
        />
        <SummaryCard
          label="Coast FIRE age"
          value={coastFireAge === null ? "-" : String(coastFireAge)}
          tooltip={scenarioSummaryTooltips.coastFireAge}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
