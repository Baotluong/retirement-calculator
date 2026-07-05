import Link from "next/link";
import { ExportComparePdfButton } from "@/components/ExportComparePdfButton";
import { notFound } from "next/navigation";
import { CompareProjectionChart } from "@/components/CompareProjectionChart";
import { CompareRetirementAgeStatsTable } from "@/components/CompareRetirementAgeStatsTable";
import { CompareStatsTable } from "@/components/CompareStatsTable";
import { parseCompareIds } from "@/lib/compare-params";
import { getConfiguration } from "@/lib/queries";
import { getScenarioRetirementAgeDetails, getScenarioSummaryStats } from "@/lib/scenario-summary";
import { projectNetWorth } from "@/lib/projection";

type PageProps = {
  searchParams: Promise<{ ids?: string | string[] }>;
};

export default async function ComparePage({ searchParams }: PageProps) {
  const { ids: idsParam } = await searchParams;
  const ids = parseCompareIds(idsParam);

  if (!ids) {
    notFound();
  }

  const configurations = await Promise.all(ids.map((id) => getConfiguration(id)));
  if (configurations.some((config) => !config)) {
    notFound();
  }

  const scenarios = configurations.map((config) => {
    const safeConfig = config!;
    return {
      id: safeConfig.id,
      name: safeConfig.name,
      stats: getScenarioSummaryStats(safeConfig),
      retirementAgeDetails: getScenarioRetirementAgeDetails(safeConfig),
      projection: projectNetWorth(safeConfig),
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Compare scenarios</p>
          <h1 className="text-3xl font-bold tracking-tight">Side-by-side comparison</h1>
          <p className="mt-2 text-zinc-600">
            Comparing {scenarios.length} scenarios by summary metrics and projected net worth.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportComparePdfButton ids={ids} />
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Back to dashboard
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Summary comparison</h2>
        <CompareStatsTable scenarios={scenarios.map(({ id, name, stats }) => ({ id, name, stats }))} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Retirement age projections</h2>
        <p className="text-sm text-zinc-600">
          Net worth if each scenario retires at its earliest sustainable age or safe retirement age.
        </p>
        <CompareRetirementAgeStatsTable
          scenarios={scenarios.map(({ id, name, retirementAgeDetails }) => ({
            id,
            name,
            details: retirementAgeDetails,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Net worth overlay</h2>
        <CompareProjectionChart
          series={scenarios.map(({ id, name, projection }) => ({ id, name, projection }))}
        />
      </section>
    </div>
  );
}
