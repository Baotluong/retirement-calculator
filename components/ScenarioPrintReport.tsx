import { ConfigForm } from "@/components/ConfigForm";
import { ProjectionChart } from "@/components/ProjectionChart";
import { ProjectionTable } from "@/components/ProjectionTable";
import { ScenarioSummaryCards } from "@/components/ScenarioSummaryCards";
import { formatCurrentAge } from "@/lib/age";
import { getScenarioSummaryStats } from "@/lib/scenario-summary";
import { projectNetWorth } from "@/lib/projection";
import type { ExpenseMonthInput, NetWorthItemInput, RetirementConfig } from "@/lib/types";

type ScenarioPrintReportProps = {
  configuration: RetirementConfig;
  netWorthBreakdown: NetWorthItemInput[];
  expenseBreakdown: ExpenseMonthInput[];
  pageBreakBefore?: boolean;
};

export function ScenarioPrintReport({
  configuration,
  netWorthBreakdown,
  expenseBreakdown,
  pageBreakBefore = false,
}: ScenarioPrintReportProps) {
  const projection = projectNetWorth(configuration);
  const summary = getScenarioSummaryStats(configuration);

  return (
    <div className={(pageBreakBefore ? "print-break-before " : "") + "space-y-8"}>
      <div>
        <p className="text-sm font-medium text-emerald-700">Retirement scenario report</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{configuration.name}</h1>
        <p className="mt-2 text-zinc-600">
          Projected from age{" "}
          {formatCurrentAge(configuration.currentAgeYears, configuration.currentAgeMonths)} to{" "}
          {configuration.lifeExpectancy}. Retire at {configuration.retirementAge}.
        </p>
        {configuration.location ? (
          <p className="mt-1 text-sm text-zinc-500">{configuration.location}</p>
        ) : null}
        {configuration.description ? (
          <p className="mt-2 text-zinc-600">{configuration.description}</p>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Summary</h2>
        <ScenarioSummaryCards {...summary} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Assumptions</h2>
        <ConfigForm
          initialValues={configuration}
          initialNetWorthBreakdown={netWorthBreakdown}
          initialExpenseBreakdown={expenseBreakdown}
          readOnly
        />
      </section>

      <section className="space-y-3 print-break-before">
        <h2 className="text-lg font-semibold text-zinc-900">Projection chart</h2>
        <ProjectionChart projection={projection} />
      </section>

      <section className="space-y-3 print-break-before">
        <h2 className="text-lg font-semibold text-zinc-900">Year-by-year breakdown</h2>
        <ProjectionTable projection={projection} />
      </section>
    </div>
  );
}
