import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/PrintToolbar";
import { ScenarioPrintReport } from "@/components/ScenarioPrintReport";
import { getConfiguration, getLatestExpenseBreakdown, getLatestNetWorthItems } from "@/lib/queries";

type PageProps = {
  searchParams: Promise<{ ids?: string }>;
};

function parseExportIds(raw: string | undefined): number[] | null {
  if (!raw?.trim()) return null;

  const ids = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  const unique = Array.from(new Set(ids));
  if (unique.length === 0) {
    return null;
  }

  return unique;
}

export default async function BulkExportPrintPage({ searchParams }: PageProps) {
  const { ids: idsParam } = await searchParams;
  const ids = parseExportIds(idsParam);

  if (!ids) {
    notFound();
  }

  const configurations = await Promise.all(ids.map((id) => getConfiguration(id)));
  if (configurations.some((config) => !config)) {
    notFound();
  }

  const [defaultNetWorthBreakdown, defaultExpenseBreakdown] = await Promise.all([
    getLatestNetWorthItems(),
    getLatestExpenseBreakdown(),
  ]);

  const reports = configurations.map((configuration) => {
    const safeConfig = configuration!;
    const netWorthBreakdown =
      safeConfig.netWorthBreakdown && safeConfig.netWorthBreakdown.length > 0
        ? safeConfig.netWorthBreakdown
        : defaultNetWorthBreakdown;
    const expenseBreakdown =
      safeConfig.expenseBreakdown &&
      safeConfig.expenseBreakdown.some((item) => item.amount > 0)
        ? safeConfig.expenseBreakdown
        : defaultExpenseBreakdown;

    return {
      configuration: safeConfig,
      netWorthBreakdown,
      expenseBreakdown,
    };
  });

  return (
    <div className="print-report space-y-8">
      <PrintToolbar backHref="/" backLabel="Back to dashboard" />

      <div>
        <p className="text-sm font-medium text-emerald-700">Retirement scenario export</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {reports.length === 1 ? "Scenario report" : reports.length + " scenario reports"}
        </h1>
        <p className="mt-2 text-zinc-600">
          {reports.length === 1
            ? "Full report for the selected scenario."
            : "Full reports for " + reports.length + " selected scenarios."}
        </p>
      </div>

      {reports.map((report, index) => (
        <ScenarioPrintReport
          key={report.configuration.id}
          configuration={report.configuration}
          netWorthBreakdown={report.netWorthBreakdown}
          expenseBreakdown={report.expenseBreakdown}
          pageBreakBefore={index > 0}
        />
      ))}
    </div>
  );
}
