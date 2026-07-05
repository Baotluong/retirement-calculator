"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ScenarioSummaryStatsGrid } from "@/components/ScenarioSummaryStatsGrid";
import { formatCurrentAge } from "@/lib/age";
import { MAX_COMPARE, MIN_COMPARE } from "@/lib/compare-params";
import type { ConfigurationListItem } from "@/components/ConfigList";

type ConfigListWithCompareProps = {
  items: ConfigurationListItem[];
};

function canCompare(count: number): boolean {
  return count >= MIN_COMPARE && count <= MAX_COMPARE;
}

function sortListItems(
  items: ConfigurationListItem[],
  favoriteById: Record<number, boolean>
): ConfigurationListItem[] {
  return [...items].sort((a, b) => {
    const aFavorite = favoriteById[a.config.id] ?? false;
    const bFavorite = favoriteById[b.config.id] ?? false;

    if (aFavorite !== bFavorite) {
      return aFavorite ? -1 : 1;
    }

    return a.config.name.localeCompare(b.config.name, undefined, { sensitivity: "base" });
  });
}

type FavoriteStarButtonProps = {
  isFavorite: boolean;
  onToggle: () => void;
};

function FavoriteStarButton({ isFavorite, onToggle }: FavoriteStarButtonProps) {
  return (
    <button
      type="button"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      onClick={onToggle}
      className={
        "shrink-0 rounded-lg p-2 transition-colors touch-manipulation " +
        (isFavorite
          ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600")
      }
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFavorite ? 0 : 1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2.5l2.86 5.79 6.39.93-4.62 4.51 1.09 6.35L12 17.77l-5.92 3.15 1.09-6.35L1.39 8.22l6.39-.93L12 2.5z"
        />
      </svg>
    </button>
  );
}

export function ConfigListWithCompare({ items }: ConfigListWithCompareProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [favoriteById, setFavoriteById] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.config.id, item.config.isFavorite]))
  );
  const [favoriteUpdatingId, setFavoriteUpdatingId] = useState<number | null>(null);

  const sortedItems = useMemo(
    () => sortListItems(items, favoriteById),
    [items, favoriteById]
  );

  const compareHref = useMemo(() => {
    if (!canCompare(selectedIds.length)) return null;
    return "/compare?ids=" + selectedIds.join(",");
  }, [selectedIds]);

  function toggleSelection(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      return [...current, id];
    });
  }

  async function toggleFavorite(id: number) {
    if (favoriteUpdatingId === id) {
      return;
    }

    const nextFavorite = !(favoriteById[id] ?? false);
    setFavoriteById((current) => ({ ...current, [id]: nextFavorite }));
    setFavoriteUpdatingId(id);

    try {
      const response = await fetch("/api/configurations/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextFavorite }),
      });

      if (!response.ok) {
        setFavoriteById((current) => ({ ...current, [id]: !nextFavorite }));
        return;
      }

      router.refresh();
    } catch {
      setFavoriteById((current) => ({ ...current, [id]: !nextFavorite }));
    } finally {
      setFavoriteUpdatingId(null);
    }
  }

  function handleClear() {
    setClearing(true);
    setSelectedIds([]);
    window.setTimeout(() => setClearing(false), 180);
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
    <div className="space-y-4 pb-4">
      <div className="grid gap-4 md:grid-cols-2">
        {sortedItems.map(({ config, summary }) => {
          const isSelected = selectedIds.includes(config.id);
          const isFavorite = favoriteById[config.id] ?? false;

          return (
            <article
              key={config.id}
              className={
                "min-w-0 rounded-xl border bg-white p-5 shadow-sm " +
                (isSelected
                  ? "border-emerald-400 ring-2 ring-emerald-200"
                  : isFavorite
                    ? "border-amber-200"
                    : "border-zinc-200")
              }
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSelection(config.id)}
                className={
                  "mb-3 flex min-h-12 w-full touch-manipulation cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98] " +
                  (isSelected
                    ? "bg-emerald-600 text-white"
                    : "border-2 border-zinc-300 bg-zinc-50 text-zinc-800")
                }
              >
                {isSelected ? "Selected - tap to deselect" : "Select scenario"}
              </button>

              <div className="flex items-start gap-2">
                <Link href={"/configurations/" + config.id} className="block min-w-0 flex-1 rounded-lg">
                  <h2 className="text-lg font-semibold text-zinc-900">{config.name}</h2>
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
                <FavoriteStarButton
                  isFavorite={isFavorite}
                  onToggle={() => toggleFavorite(config.id)}
                />
              </div>

              <div className="mt-4 min-w-0 border-t border-zinc-100 pt-4">
                <ScenarioSummaryStatsGrid stats={summary} compact />
              </div>
            </article>
          );
        })}
      </div>

      {selectedIds.length > 0 ? (
        <div
          className="sticky bottom-0 z-40 -mx-6 mt-4 flex flex-col gap-3 border-t border-emerald-200 bg-white/95 px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 sm:bottom-4 sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:shadow-lg"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <p className="text-sm font-medium text-zinc-800">{compareMessage}</p>
          <div className="flex flex-wrap gap-2 sm:mt-0">
            <button
              type="button"
              onClick={handleClear}
              className={
                "min-h-12 touch-manipulation rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-transform duration-150 active:scale-[0.96] " +
                (clearing ? "scale-95 bg-zinc-100" : "hover:bg-zinc-50")
              }
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="min-h-12 touch-manipulation rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
            {compareHref ? (
              <Link
                href={compareHref}
                className="inline-flex min-h-12 touch-manipulation items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Compare selected
              </Link>
            ) : (
              <span className="inline-flex min-h-12 items-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600">
                {selectedIds.length > MAX_COMPARE
                  ? "Compare up to " + MAX_COMPARE
                  : "Select at least " + MIN_COMPARE + " to compare"}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}