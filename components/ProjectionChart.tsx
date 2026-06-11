"use client";

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
import { formatPartialYearLabel, formatProjectionAge } from "@/lib/age";
import type { ProjectionYear } from "@/lib/types";

type ProjectionChartProps = {
  projection: ProjectionYear[];
};

const CHART_HEIGHT = 320;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
            <LineChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="age"
                tickFormatter={(value) => {
                  const row = projection.find((point) => point.age === Number(value));
                  return row ? formatChartAgeLabel(row) : `${value}`;
                }}
                tick={{ fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                tick={{ fontSize: 12 }}
                width={56}
              />
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
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}