import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/ConfigForm";
import { getConfiguration } from "@/lib/queries";
import type { RetirementConfigInput } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

function toClonePrefill(
  source: NonNullable<Awaited<ReturnType<typeof getConfiguration>>>
): RetirementConfigInput {
  return {
    name: "Copy of " + source.name,
    description: source.description ?? "",
    location: source.location ?? "",
    currentAgeYears: source.currentAgeYears,
    currentAgeMonths: source.currentAgeMonths,
    retirementAge: source.retirementAge,
    lifeExpectancy: source.lifeExpectancy,
    currentNetWorth: source.currentNetWorth,
    annualIncome: source.annualIncome,
    annualExpenses: source.annualExpenses,
    investmentReturnRate: source.investmentReturnRate,
    inflationRate: source.inflationRate,
    postRetirementExpenses: source.postRetirementExpenses ?? 0,
  };
}

export default async function CloneConfigurationPage({ params }: PageProps) {
  const { id } = await params;
  const configId = Number(id);

  if (!Number.isInteger(configId) || configId <= 0) {
    notFound();
  }

  const source = await getConfiguration(configId);

  if (!source) {
    notFound();
  }

  const netWorthBreakdown =
    source.netWorthBreakdown && source.netWorthBreakdown.length > 0
      ? source.netWorthBreakdown
      : [];
  const expenseBreakdown =
    source.expenseBreakdown && source.expenseBreakdown.some((item) => item.amount > 0)
      ? source.expenseBreakdown
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Clone scenario</p>
          <h1 className="text-3xl font-bold tracking-tight">Copy of {source.name}</h1>
          <p className="mt-2 text-zinc-600">
            Review and adjust the copied assumptions, then save to create a new scenario.
          </p>
        </div>
        <Link
          href={"/configurations/" + source.id}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Back to source scenario
        </Link>
      </div>
      <ConfigForm
        prefill={toClonePrefill(source)}
        initialNetWorthBreakdown={netWorthBreakdown}
        initialExpenseBreakdown={expenseBreakdown}
      />
    </div>
  );
}
