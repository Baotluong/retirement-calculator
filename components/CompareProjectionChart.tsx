"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatProjectionAge } from "@/lib/age";
import type { ProjectionYear } from "@/lib/types";

export type CompareChartSeries = {
  name: string;
  projection: ProjectionYear[];
};

const SERIES_COLORS = ["#059669", "#2563eb", "#dc2626", "#9333ea"] as const;

type CompareProjectionChartProps = {
  series: CompareChartSeries[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildChartData(series: CompareChartSeries[]) {
  const ages = new Set<number>();
  for (const item of series) {
    for (const row of item.projection) {
      ages.add(row.age);
    }
  }

  return Array.from(ages)
    .sort((a, b) => a - b)
    .map((age) => {
      const point: Record<string, number> = { age };
      series.forEach((item, index) => {
        const row = item.projection.find((entry) => entry.age === age);
        if (row) {
          point["series" + index] = row.netWorth;
        }
      });
      return point;
    });
}

export function CompareProjectionChart({ series }: CompareProjectionChartProps) {
  const data = buildChartData(series);

  return (
    <div className="h-96 w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis
            dataKey="age"
            tickFormatter={(value) => formatProjectionAge(Number(value))}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => "$" + Math.round(Number(value) / 1000) + "k"}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => "Age " + formatProjectionAge(Number(label))}
          />
          <Legend />
          {series.map((item, index) => (
            <Line
              key={item.name}
              type="monotone"
              dataKey={"series" + index}
              name={item.name}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
