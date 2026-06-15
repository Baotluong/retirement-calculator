import { getSafeRetirementThresholdAtDeath, projectNetWorth, SAFE_RETIREMENT_EXPENSE_MULTIPLIER } from "@/lib/projection";
import type { RetirementConfig } from "@/lib/types";

export type RetirementAgeProjectionStats = {
  retirementAge: number;
  netWorthAtRetirement: number;
  peakNetWorth: number;
  endingNetWorth: number;
};

export type ScenarioRetirementAgeDetails = {
  earliest: RetirementAgeProjectionStats | null;
  safe: RetirementAgeProjectionStats | null;
};

export type ScenarioSummaryStats = {
  earliestRetirementAge: number | null;
  safeRetirementAge: number | null;
  safeRetirementAmount: number | null;
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
    "Annual takehome minus annual expenses while working - what you save or invest each year before retirement.",
  retirementAgeNetWorth:
    "Projected net worth in the year you retire at this age, assuming you stop working then.",
  retirementAgePeakNetWorth:
    "Highest projected net worth from now through life expectancy if you retire at this age.",
  retirementAgeEndingNetWorth:
    "Projected net worth at life expectancy if you retire at this age.",
} as const;

export function formatSafeRetirementAgeTooltip(
  safeAmount: number | null
): string {
  const base =
    `The earliest age you can retire and still have net worth at life expectancy of at least ${SAFE_RETIREMENT_EXPENSE_MULTIPLIER}x your inflated annual expenses (including post-retirement expenses).`;

  if (safeAmount === null) {
    return `${base} Recalculated when you save.`;
  }

  return `${base} For this scenario, the required minimum is ${formatScenarioCurrency(safeAmount)}. Recalculated when you save.`;
}

export function getRetirementAgeProjectionStats(
  config: RetirementConfig,
  retirementAge: number | null
): RetirementAgeProjectionStats | null {
  if (retirementAge === null) {
    return null;
  }

  const projection = projectNetWorth({
    ...config,
    retirementAge,
  });

  if (projection.length === 0) {
    return null;
  }

  const retirementPoint =
    projection.find((row) => row.age === retirementAge) ??
    projection[projection.length - 1];

  return {
    retirementAge,
    netWorthAtRetirement: retirementPoint.netWorth,
    peakNetWorth: Math.max(...projection.map((row) => row.netWorth)),
    endingNetWorth: projection[projection.length - 1].netWorth,
  };
}

export function getScenarioRetirementAgeDetails(
  config: RetirementConfig
): ScenarioRetirementAgeDetails {
  return {
    earliest: getRetirementAgeProjectionStats(
      config,
      config.earliestRetirementAge
    ),
    safe: getRetirementAgeProjectionStats(config, config.safeRetirementAge),
  };
}

export function getScenarioSummaryStats(
  config: RetirementConfig
): ScenarioSummaryStats {
  const projection = projectNetWorth(config);
  const retirementPoint =
    projection.find((row) => row.age === config.retirementAge) ??
    projection[projection.length - 1];
  const endPoint = projection[projection.length - 1];
  const safeRetirementAmount =
    config.safeRetirementAge !== null
      ? getSafeRetirementThresholdAtDeath({
          ...config,
          retirementAge: config.safeRetirementAge,
        })
      : null;

  return {
    earliestRetirementAge: config.earliestRetirementAge,
    safeRetirementAge: config.safeRetirementAge,
    safeRetirementAmount,
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
