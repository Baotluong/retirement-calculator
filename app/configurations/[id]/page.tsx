import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/ConfigForm";
import { DeleteScenarioButton } from "@/components/DeleteScenarioButton";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ProjectionChart } from "@/components/ProjectionChart";
import { ScenarioSummaryCards } from "@/components/ScenarioSummaryCards";
import { ProjectionTable } from "@/components/ProjectionTable";
import { formatCurrentAge } from "@/lib/age";
import { getConfiguration, getLatestExpenseBreakdown, getLatestNetWorthItems } from "@/lib/queries";
import { getScenarioSummaryStats } from "@/lib/scenario-summary";
import { projectNetWorth } from "@/lib/projection";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConfigurationPage({ params }: PageProps) {
  const { id } = await params;
  const configId = Number(id);

  if (!Number.isInteger(configId) || configId <= 0) {
    notFound();
  }

  const configuration = await getConfiguration(configId);

  if (!configuration) {
    notFound();
  }

  const netWorthBreakdown =
    configuration.netWorthBreakdown && configuration.netWorthBreakdown.length > 0
      ? configuration.netWorthBreakdown
      : await getLatestNetWorthItems();
  const expenseBreakdown =
    configuration.expenseBreakdown &&
    configuration.expenseBreakdown.some((item) => item.amount > 0)
      ? configuration.expenseBreakdown
      : await getLatestExpenseBreakdown();
  const projection = projectNetWorth(configuration);
  const summary = getScenarioSummaryStats(configuration);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Scenario</p>
          <h1 className="text-3xl font-bold tracking-tight">{configuration.name}</h1>
          <p className="mt-2 text-zinc-600">
            Projected from age {formatCurrentAge(configuration.currentAgeYears, configuration.currentAgeMonths)} to {configuration.lifeExpectancy}. Retire at {configuration.retirementAge}
            {configuration.earliestRetirementAge !== null
              ? ", earliest sustainable age " + configuration.earliestRetirementAge
              : ""}
            {configuration.safeRetirementAge !== null
              ? ", safe retirement age " + configuration.safeRetirementAge
              : ""}
            .
          </p>
          {configuration.location ? (
            <p className="mt-1 text-sm text-zinc-500">{configuration.location}</p>
          ) : null}
          {configuration.description ? (
            <p className="mt-2 max-w-2xl text-zinc-600">{configuration.description}</p>
          ) : null}
        </div>
        <div className="no-print flex flex-wrap items-center gap-3">
          <ExportPdfButton configurationId={configuration.id} />
          <Link
            href={`/configurations/${configuration.id}/clone`}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Clone scenario
          </Link>
          <DeleteScenarioButton
            id={configuration.id}
            name={configuration.name}
          />
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Back to dashboard
          </Link>
        </div>
      </div>

      <ScenarioSummaryCards {...summary} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Edit assumptions</h2>
        <ConfigForm
          initialValues={configuration}
          initialNetWorthBreakdown={netWorthBreakdown}
          initialExpenseBreakdown={expenseBreakdown}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Projection chart</h2>
        <ProjectionChart projection={projection} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Year-by-year breakdown</h2>
        <ProjectionTable projection={projection} />
      </section>
    </div>
  );
}
