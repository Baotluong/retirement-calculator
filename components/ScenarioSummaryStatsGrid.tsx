import { InfoTooltip } from "@/components/InfoTooltip";
import {
  formatSafeRetirementAgeTooltip,
  formatScenarioCurrency,
  scenarioSummaryTooltips,
  type ScenarioSummaryStats,
} from "@/lib/scenario-summary";

type ScenarioSummaryStatsGridProps = {
  stats: ScenarioSummaryStats;
  compact?: boolean;
};

type StatItemProps = {
  label: string;
  value: string;
  tooltip: string;
  compact?: boolean;
};

function StatItem({ label, value, tooltip, compact = false }: StatItemProps) {
  return (
    <div>
      <dt
        className={
          compact
            ? "inline-flex items-center gap-1 text-xs text-zinc-500"
            : "inline-flex items-center gap-1.5 text-sm text-zinc-500"
        }
      >
        {label}
        <InfoTooltip text={tooltip} />
      </dt>
      <dd
        className={
          compact
            ? "mt-0.5 text-sm font-semibold text-zinc-900"
            : "mt-2 text-2xl font-semibold text-zinc-900"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function ScenarioSummaryStatsGrid({
  stats,
  compact = false,
}: ScenarioSummaryStatsGridProps) {
  const safeRetirementTooltip = formatSafeRetirementAgeTooltip(
    stats.safeRetirementAmount
  );

  return (
    <dl
      className={
        compact
          ? "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      }
    >
      <StatItem
        label="Earliest retirement age"
        value={stats.earliestRetirementAge === null ? "-" : String(stats.earliestRetirementAge)}
        tooltip={scenarioSummaryTooltips.earliestRetirementAge}
        compact={compact}
      />
      <StatItem
        label="Safe retirement age"
        value={stats.safeRetirementAge === null ? "-" : String(stats.safeRetirementAge)}
        tooltip={safeRetirementTooltip}
        compact={compact}
      />
      <StatItem
        label="Net worth at retirement"
        value={formatScenarioCurrency(stats.netWorthAtRetirement)}
        tooltip={scenarioSummaryTooltips.netWorthAtRetirement}
        compact={compact}
      />
      <StatItem
        label="Net worth at life expectancy"
        value={formatScenarioCurrency(stats.netWorthAtLifeExpectancy)}
        tooltip={scenarioSummaryTooltips.netWorthAtLifeExpectancy}
        compact={compact}
      />
      <StatItem
        label="Annual takehome"
        value={formatScenarioCurrency(stats.annualTakehome)}
        tooltip={scenarioSummaryTooltips.annualTakehome}
        compact={compact}
      />
      <StatItem
        label="Annual contributions"
        value={formatScenarioCurrency(stats.annualContributions)}
        tooltip={scenarioSummaryTooltips.annualContributions}
        compact={compact}
      />
    </dl>
  );
}