import { InfoTooltip } from "@/components/InfoTooltip";
import type { ProjectionYear } from "@/lib/types";
import { formatPartialYearLabel, formatProjectionAge } from "@/lib/age";

type ProjectionTableProps = {
  projection: ProjectionYear[];
};

type ColumnHeaderProps = {
  label: string;
  tooltip: string;
};

const calculatedColumnTooltips = {
  netWorth:
    "Starting balance plus this period's contributions and investment growth.",
  income:
    "Take-home while working, prorated for partial years. $0 during an income delay, after retirement, or while unemployed.",
  expenses:
    "Inflated annual expenses, plus any post-retirement adjustment when retired.",
  contributions: "Income minus expenses for this period.",
  growth:
    "Investment return applied to the balance after contributions, prorated for partial years.",
} as const;

function ColumnHeader({ label, tooltip }: ColumnHeaderProps) {
  return (
    <th className="relative px-4 py-3 font-medium">
      <span className="inline-flex items-center gap-1.5">
        {label}
        <InfoTooltip text={tooltip} />
      </span>
    </th>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectionTable({ projection }: ProjectionTableProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <ColumnHeader
                label="Net worth"
                tooltip={calculatedColumnTooltips.netWorth}
              />
              <ColumnHeader
                label="Income"
                tooltip={calculatedColumnTooltips.income}
              />
              <ColumnHeader
                label="Expenses"
                tooltip={calculatedColumnTooltips.expenses}
              />
              <ColumnHeader
                label="Contributions"
                tooltip={calculatedColumnTooltips.contributions}
              />
              <ColumnHeader
                label="Growth"
                tooltip={calculatedColumnTooltips.growth}
              />
            </tr>
          </thead>
          <tbody>
            {projection.map((row) => (
              <tr key={`${row.age}-${row.year}`} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{formatProjectionAge(row.age)}</span>
                    {row.isPartialYear ? (
                      <span className="group/partial relative">
                        <span className="cursor-default rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {formatPartialYearLabel(row.partialMonths)}
                        </span>
                        <span
                          role="tooltip"
                          className="pointer-events-none invisible absolute bottom-full left-0 z-30 mb-2 w-52 rounded-md bg-zinc-900 px-2.5 py-2 text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/partial:visible group-hover/partial:opacity-100"
                        >
                          Income and expenses cover only the remaining months until this age.
                        </span>
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">{row.year}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {formatCurrency(row.netWorth)}
                </td>
                <td className="px-4 py-3">{formatCurrency(row.income)}</td>
                <td className="px-4 py-3">{formatCurrency(row.expenses)}</td>
                <td className="px-4 py-3">{formatCurrency(row.contributions)}</td>
                <td className="px-4 py-3">{formatCurrency(row.growth)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


