"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
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
  id: number;
  name: string;
  projection: ProjectionYear[];
};

const SERIES_COLORS = ["#059669", "#2563eb", "#dc2626", "#9333ea"] as const;
const CHART_HEIGHT = 384;

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
  const [mounted, setMounted] = useState(false);
  const data = buildChartData(series);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="age"
                tickFormatter={(value) => formatProjectionAge(Number(value))}
                tick={{ fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(value) => "$" + Math.round(Number(value) / 1000) + "k"}
                tick={{ fontSize: 12 }}
                width={56}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => "Age " + formatProjectionAge(Number(label))}
              />
              {series.map((item, index) => (
                <Line
                  key={item.id}
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
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading chart...
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((item, index) => (
          <Link
            key={item.id}
            href={"/configurations/" + item.id}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}