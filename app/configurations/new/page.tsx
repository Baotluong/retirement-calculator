import { ConfigForm } from "@/components/ConfigForm";
import { getLatestExpenseBreakdown, getLatestNetWorthItems } from "@/lib/queries";

export default async function NewConfigurationPage() {
  const [latestNetWorthBreakdown, latestExpenseBreakdown] = await Promise.all([
    getLatestNetWorthItems(),
    getLatestExpenseBreakdown(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New scenario</h1>
        <p className="mt-2 text-zinc-600">
          Enter your current finances and assumptions to project net worth by age.
        </p>
      </div>
      <ConfigForm
        initialNetWorthBreakdown={latestNetWorthBreakdown}
        initialExpenseBreakdown={latestExpenseBreakdown}
      />
    </div>
  );
}
