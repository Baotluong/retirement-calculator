import { ConfigList } from "@/components/ConfigList";
import { getScenarioSummaryStats } from "@/lib/scenario-summary";
import { listConfigurations } from "@/lib/queries";

export const dynamic = "force-dynamic";

function sortConfigurationListItems<T extends { config: { isFavorite: boolean; name: string } }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    if (a.config.isFavorite !== b.config.isFavorite) {
      return a.config.isFavorite ? -1 : 1;
    }

    return a.config.name.localeCompare(b.config.name, undefined, { sensitivity: "base" });
  });
}

export default async function HomePage() {
  const items = sortConfigurationListItems(
    (await listConfigurations()).map((config) => ({
      config,
      summary: getScenarioSummaryStats(config),
    }))
  );

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
