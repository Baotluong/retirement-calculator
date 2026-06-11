"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPartialYearLabel, formatProjectionAge } from "@/lib/age";
import type { ProjectionYear } from "@/lib/types";

type ProjectionChartProps = {
  projection: ProjectionYear[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatChartAgeLabel(row: ProjectionYear): string {
  if (row.isPartialYear) {
    return `${formatProjectionAge(row.age)} (${formatPartialYearLabel(row.partialMonths)})`;
  }

  return formatProjectionAge(row.age);
}

export function ProjectionChart({ projection }: ProjectionChartProps) {
  return (
    <div className="h-80 w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={projection}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis
            dataKey="age"
            tickFormatter={(value) => {
              const row = projection.find((point) => point.age === Number(value));
              return row ? formatChartAgeLabel(row) : `${value}`;
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as ProjectionYear | undefined;
              return row ? `Age ${formatChartAgeLabel(row)}` : "Age";
            }}
          />
          <Line type="monotone" dataKey="netWorth" stroke="#059669" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
