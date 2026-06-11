import { notFound } from "next/navigation";
import { PrintAutoTrigger } from "@/components/PrintAutoTrigger";
import { PrintToolbar } from "@/components/PrintToolbar";
import { ScenarioPrintReport } from "@/components/ScenarioPrintReport";
import { getConfiguration, getLatestExpenseBreakdown, getLatestNetWorthItems } from "@/lib/queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
};

export default async function PrintConfigurationPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { autoprint } = await searchParams;
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

  const autoPrint = autoprint === "1";

  return (
    <div className="print-report space-y-8">
      <PrintAutoTrigger enabled={autoPrint} />
      <PrintToolbar backHref={"/configurations/" + configuration.id} />
      <ScenarioPrintReport
        configuration={configuration}
        netWorthBreakdown={netWorthBreakdown}
        expenseBreakdown={expenseBreakdown}
      />
    </div>
  );
}
