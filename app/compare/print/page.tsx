import { notFound } from "next/navigation";
import { CompareProjectionChart } from "@/components/CompareProjectionChart";
import { CompareRetirementAgeStatsTable } from "@/components/CompareRetirementAgeStatsTable";
import { CompareStatsTable } from "@/components/CompareStatsTable";
import { PrintToolbar } from "@/components/PrintToolbar";
import { parseCompareIds } from "@/lib/compare-params";
import { getConfiguration } from "@/lib/queries";
import { getScenarioRetirementAgeDetails, getScenarioSummaryStats } from "@/lib/scenario-summary";
import { projectNetWorth } from "@/lib/projection";

type PageProps = {
  searchParams: Promise<{ ids?: string | string[] }>;
};

export default async function ComparePrintPage({ searchParams }: PageProps) {
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

  const compareHref = "/compare?ids=" + ids.join(",");

  return (
    <div className="print-report space-y-8">
      <PrintToolbar backHref={compareHref} backLabel="Back to comparison" />

      <div>
        <p className="text-sm font-medium text-emerald-700">Scenario comparison report</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Side-by-side comparison</h1>
        <p className="mt-2 text-zinc-600">
          Comparing {scenarios.length} scenarios by summary metrics and projected net worth.
        </p>
        <ul className="mt-3 list-inside list-disc text-sm text-zinc-600">
          {scenarios.map((scenario) => (
            <li key={scenario.name}>{scenario.name}</li>
          ))}
        </ul>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Summary comparison</h2>
        <CompareStatsTable scenarios={scenarios.map(({ id, name, stats }) => ({ id, name, stats }))} />
      </section>

      <section className="space-y-3 print-break-before">
        <h2 className="text-lg font-semibold text-zinc-900">Retirement age projections</h2>
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

      <section className="space-y-3 print-break-before">
        <h2 className="text-lg font-semibold text-zinc-900">Net worth overlay</h2>
        <CompareProjectionChart
          series={scenarios.map(({ id, name, projection }) => ({ id, name, projection }))}
        />
      </section>
    </div>
  );
}
