"use client";

import { useState } from "react";
import { ProjectionTable } from "@/components/ProjectionTable";
import type { ScenarioProjectionView } from "@/lib/scenario-summary";

type ProjectionTabsProps = {
  views: ScenarioProjectionView[];
};

export function ProjectionTabs({ views }: ProjectionTabsProps) {
  const [activeId, setActiveId] = useState(views[0]?.id ?? "plan");
  const activeView = views.find((view) => view.id === activeId) ?? views[0];

  if (!activeView) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3"
        role="tablist"
        aria-label="Projection breakdown views"
      >
        {views.map((view) => {
          const isActive = view.id === activeView.id;

          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(view.id)}
              className={
                "rounded-lg px-3 py-2 text-left text-sm transition " +
                (isActive
                  ? "bg-emerald-600 font-semibold text-white shadow-sm"
                  : "bg-zinc-100 font-medium text-zinc-700 hover:bg-zinc-200")
              }
            >
              <span className="block">{view.label}</span>
              <span
                className={
                  "mt-0.5 block text-xs " + (isActive ? "text-emerald-50" : "text-zinc-500")
                }
              >
                {view.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        <ProjectionTable projection={activeView.projection} />
      </div>
    </div>
  );
}