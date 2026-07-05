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
  shortLabel?: string;
  value: string;
  tooltip: string;
  compact?: boolean;
};

function StatItem({
  label,
  shortLabel,
  value,
  tooltip,
  compact = false,
}: StatItemProps) {
  const displayLabel = compact && shortLabel ? shortLabel : label;

  return (
    <div className={compact ? "min-w-0" : undefined}>
      <dt
        className={
          compact
            ? "flex min-w-0 items-center gap-0.5 text-xs text-zinc-500"
            : "inline-flex items-center gap-1.5 text-sm text-zinc-500"
        }
      >
        <span className={compact ? "min-w-0 truncate" : undefined}>{displayLabel}</span>
        <span className="shrink-0">
          <InfoTooltip text={tooltip} />
        </span>
      </dt>
      <dd
        className={
          compact
            ? "mt-0.5 truncate text-sm font-semibold text-zinc-900"
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
          ? "grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7"
      }
    >
      <StatItem
        label="Earliest retirement age"
        shortLabel="Earliest age"
        value={stats.earliestRetirementAge === null ? "-" : String(stats.earliestRetirementAge)}
        tooltip={scenarioSummaryTooltips.earliestRetirementAge}
        compact={compact}
      />
      <StatItem
        label="Safe retirement age"
        shortLabel="Safe age"
        value={stats.safeRetirementAge === null ? "-" : String(stats.safeRetirementAge)}
        tooltip={safeRetirementTooltip}
        compact={compact}
      />
      <StatItem
        label="Coast FIRE age"
        shortLabel="Coast age"
        value={stats.coastFireAge === null ? "-" : String(stats.coastFireAge)}
        tooltip={scenarioSummaryTooltips.coastFireAge}
        compact={compact}
      />
      <StatItem
        label="Net worth at retirement"
        shortLabel="NW at retire"
        value={formatScenarioCurrency(stats.netWorthAtRetirement)}
        tooltip={scenarioSummaryTooltips.netWorthAtRetirement}
        compact={compact}
      />
      <StatItem
        label="Net worth at life expectancy"
        shortLabel="NW at end"
        value={formatScenarioCurrency(stats.netWorthAtLifeExpectancy)}
        tooltip={scenarioSummaryTooltips.netWorthAtLifeExpectancy}
        compact={compact}
      />
      <StatItem
        label="Annual takehome"
        shortLabel="Takehome"
        value={formatScenarioCurrency(stats.annualTakehome)}
        tooltip={scenarioSummaryTooltips.annualTakehome}
        compact={compact}
      />
      <StatItem
        label="Annual contributions"
        shortLabel="Contributions"
        value={formatScenarioCurrency(stats.annualContributions)}
        tooltip={scenarioSummaryTooltips.annualContributions}
        compact={compact}
      />
    </dl>
  );
}


