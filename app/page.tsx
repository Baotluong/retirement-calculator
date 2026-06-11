import { ConfigList } from "@/components/ConfigList";
import { getScenarioSummaryStats } from "@/lib/scenario-summary";
import { listConfigurations } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = (await listConfigurations())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .map((config) => ({
      config,
      summary: getScenarioSummaryStats(config),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your scenarios</h1>
        <p className="mt-2 text-zinc-600">
          Save different retirement assumptions and compare how your net worth could grow over time.
        </p>
      </div>
      <ConfigList items={items} />
    </div>
  );
}
