"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScenarioSummaryStatsGrid } from "@/components/ScenarioSummaryStatsGrid";
import { formatCurrentAge } from "@/lib/age";
import type { ConfigurationListItem } from "@/components/ConfigList";

const MAX_COMPARE = 4;
const MIN_COMPARE = 2;

type ConfigListWithCompareProps = {
  items: ConfigurationListItem[];
};

function canCompare(count: number): boolean {
  return count >= MIN_COMPARE && count <= MAX_COMPARE;
}

export function ConfigListWithCompare({ items }: ConfigListWithCompareProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const compareHref = useMemo(() => {
    if (!canCompare(selectedIds.length)) return null;
    return "/compare?ids=" + selectedIds.join(",");
  }, [selectedIds]);

  const [exporting, setExporting] = useState(false);

  function toggleSelection(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      return [...current, id];
    });
  }

  async function handleExport() {
    if (selectedIds.length === 0 || exporting) return;

    setExporting(true);
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "scenario-reports.zip";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-zinc-600">No scenarios yet.</p>
        <Link
          href="/configurations/new"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create your first scenario
        </Link>
      </div>
    );
  }

  const compareMessage =
    selectedIds.length > MAX_COMPARE
      ? "Compare up to " + MAX_COMPARE + " scenarios (export still available)"
      : selectedIds.length < MIN_COMPARE
        ? "Select " + MIN_COMPARE + "-" + MAX_COMPARE + " to compare, or any number to export"
        : selectedIds.length + " selected";

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ config, summary }) => {
          const isSelected = selectedIds.includes(config.id);

          return (
            <div
              key={config.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleSelection(config.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleSelection(config.id);
                }
              }}
              className={
                "cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition " +
                (isSelected
                  ? "border-emerald-400 ring-1 ring-emerald-200"
                  : "border-zinc-200 hover:border-emerald-300 hover:shadow-md")
              }
            >
              <div className="flex items-start gap-3">
                <Link
                  href={"/configurations/" + config.id}
                  onClick={(event) => event.stopPropagation()}
                  className="min-w-0 flex-1 rounded-lg hover:bg-zinc-50"
                >
                  <h2 className="text-lg font-semibold text-zinc-900 hover:text-emerald-800">
                    {config.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Age {formatCurrentAge(config.currentAgeYears, config.currentAgeMonths)} to{" "}
                    {config.lifeExpectancy} - Retire at {config.retirementAge}
                  </p>
                  {config.location ? (
                    <p className="mt-1 text-sm text-zinc-500">{config.location}</p>
                  ) : null}
                  {config.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{config.description}</p>
                  ) : null}
                </Link>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(config.id)}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600"
                  aria-label={"Select " + config.name}
                />
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-4">
                <ScenarioSummaryStatsGrid stats={summary} compact />
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 ? (
        <div className="sticky bottom-4 z-40 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-lg">
          <p className="text-sm text-zinc-700">{compareMessage}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
            {compareHref ? (
              <Link
                href={compareHref}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Compare selected
              </Link>
            ) : (
              <span className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500">
                {selectedIds.length > MAX_COMPARE
                  ? "Compare up to " + MAX_COMPARE
                  : "Select at least " + MIN_COMPARE + " to compare"}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}



