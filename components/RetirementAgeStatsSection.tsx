import { InfoTooltip } from "@/components/InfoTooltip";
import {
  formatScenarioCurrency,
  scenarioSummaryTooltips,
  type RetirementAgeProjectionStats,
  type ScenarioRetirementAgeDetails,
} from "@/lib/scenario-summary";

type RetirementAgeStatsSectionProps = {
  details: ScenarioRetirementAgeDetails;
};

type StatRowProps = {
  label: string;
  value: string;
  tooltip: string;
};

function StatRow({ label, value, tooltip }: StatRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-3 last:border-b-0">
      <dt className="inline-flex min-w-0 items-center gap-1.5 text-sm text-zinc-500">
        <span>{label}</span>
        <InfoTooltip text={tooltip} />
      </dt>
      <dd className="shrink-0 text-sm font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

type RetirementAgeCardProps = {
  title: string;
  stats: RetirementAgeProjectionStats | null;
  netWorthLabel: string;
  netWorthTooltip: string;
  peakNetWorthTooltip: string;
  endingNetWorthTooltip: string;
};

function RetirementAgeCard({
  title,
  stats,
  netWorthLabel,
  netWorthTooltip,
  peakNetWorthTooltip,
  endingNetWorthTooltip,
}: RetirementAgeCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {stats ? (
        <dl className="mt-3">
          <StatRow
            label={netWorthLabel}
            value={formatScenarioCurrency(stats.netWorthAtRetirement)}
            tooltip={netWorthTooltip}
          />
          <StatRow
            label="Peak net worth"
            value={formatScenarioCurrency(stats.peakNetWorth)}
            tooltip={peakNetWorthTooltip}
          />
          <StatRow
            label="Ending net worth"
            value={formatScenarioCurrency(stats.endingNetWorth)}
            tooltip={endingNetWorthTooltip}
          />
        </dl>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Not available for this scenario.</p>
      )}
    </article>
  );
}

export function RetirementAgeStatsSection({ details }: RetirementAgeStatsSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Retirement age projections</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Net worth under earliest retirement, safe retirement, or coast FIRE until your chosen retirement age.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RetirementAgeCard
          title={
            details.earliest
              ? "Earliest retirement age (" + details.earliest.retirementAge + ")"
              : "Earliest retirement age"
          }
          stats={details.earliest}
          netWorthLabel="Net worth at retirement"
          netWorthTooltip={scenarioSummaryTooltips.retirementAgeNetWorth}
          peakNetWorthTooltip={scenarioSummaryTooltips.retirementAgePeakNetWorth}
          endingNetWorthTooltip={scenarioSummaryTooltips.retirementAgeEndingNetWorth}
        />
        <RetirementAgeCard
          title={
            details.safe
              ? "Safe retirement age (" + details.safe.retirementAge + ")"
              : "Safe retirement age"
          }
          stats={details.safe}
          netWorthLabel="Net worth at retirement"
          netWorthTooltip={scenarioSummaryTooltips.retirementAgeNetWorth}
          peakNetWorthTooltip={scenarioSummaryTooltips.retirementAgePeakNetWorth}
          endingNetWorthTooltip={scenarioSummaryTooltips.retirementAgeEndingNetWorth}
        />
        <RetirementAgeCard
          title={
            details.coast
              ? "Coast FIRE age (" + details.coast.retirementAge + ")"
              : "Coast FIRE age"
          }
          stats={details.coast}
          netWorthLabel="Net worth at coast age"
          netWorthTooltip={scenarioSummaryTooltips.coastAgeNetWorth}
          peakNetWorthTooltip={scenarioSummaryTooltips.coastAgePeakNetWorth}
          endingNetWorthTooltip={scenarioSummaryTooltips.coastAgeEndingNetWorth}
        />
        <RetirementAgeCard
          title={
            details.retireAt50
              ? "Retire at 50 (" + details.retireAt50.retirementAge + ")"
              : "Retire at 50"
          }
          stats={details.retireAt50}
          netWorthLabel="Net worth at retirement"
          netWorthTooltip={scenarioSummaryTooltips.retireAt50NetWorth}
          peakNetWorthTooltip={scenarioSummaryTooltips.retireAt50PeakNetWorth}
          endingNetWorthTooltip={scenarioSummaryTooltips.retireAt50EndingNetWorth}
        />
      </div>
    </section>
  );
}
