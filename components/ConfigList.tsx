import type { ScenarioSummaryStats } from "@/lib/scenario-summary";
import type { RetirementConfig } from "@/lib/types";

export type ConfigurationListItem = {
  config: RetirementConfig;
  summary: ScenarioSummaryStats;
};

export { ConfigListWithCompare as ConfigList } from "@/components/ConfigListWithCompare";
