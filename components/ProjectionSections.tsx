import { ProjectionTable } from "@/components/ProjectionTable";
import type { ScenarioProjectionView } from "@/lib/scenario-summary";

type ProjectionSectionsProps = {
  views: ScenarioProjectionView[];
};

export function ProjectionSections({ views }: ProjectionSectionsProps) {
  return (
    <div className="space-y-8">
      {views.map((view) => (
        <section key={view.id} className="space-y-3 print-break-before">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">{view.label}</h3>
            <p className="mt-1 text-sm text-zinc-600">{view.subtitle}</p>
          </div>
          <ProjectionTable projection={view.projection} />
        </section>
      ))}
    </div>
  );
}