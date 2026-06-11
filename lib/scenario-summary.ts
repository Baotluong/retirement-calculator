import { projectNetWorth } from "@/lib/projection";
import type { RetirementConfig } from "@/lib/types";

export type ScenarioSummaryStats = {
  earliestRetirementAge: number | null;
  netWorthAtRetirement: number;
  netWorthAtLifeExpectancy: number;
  annualTakehome: number;
  annualContributions: number;
};

export const scenarioSummaryTooltips = {
  earliestRetirementAge:
    "The earliest age you can retire while keeping net worth positive through life expectancy. Recalculated when you save.",
  netWorthAtRetirement:
    "Projected net worth at your chosen retirement age, including contributions and investment growth through that year.",
  netWorthAtLifeExpectancy:
    "Projected net worth at life expectancy based on your retirement age, spending, and return assumptions.",
  annualTakehome:
    "Post-tax income you bring home each year while working. Not inflated over time in this scenario.",
  annualContributions:
    "Annual takehome minus annual expenses while working — what you save or invest each year before retirement.",
} as const;

export function getScenarioSummaryStats(
  config: RetirementConfig
): ScenarioSummaryStats {
  const projection = projectNetWorth(config);
  const retirementPoint =
    projection.find((row) => row.age === config.retirementAge) ??
    projection[projection.length - 1];
  const endPoint = projection[projection.length - 1];

  return {
    earliestRetirementAge: config.earliestRetirementAge,
    netWorthAtRetirement: retirementPoint?.netWorth ?? 0,
    netWorthAtLifeExpectancy: endPoint?.netWorth ?? 0,
    annualTakehome: config.annualIncome,
    annualContributions: config.annualIncome - config.annualExpenses,
  };
}

export function formatScenarioCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
