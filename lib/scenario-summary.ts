import { getSafeRetirementThresholdAtDeath, projectNetWorth, SAFE_RETIREMENT_EXPENSE_MULTIPLIER } from "@/lib/projection";
import type { ProjectionYear, RetirementConfig } from "@/lib/types";

export type RetirementAgeProjectionStats = {
  retirementAge: number;
  netWorthAtRetirement: number;
  peakNetWorth: number;
  endingNetWorth: number;
};

export const RETIRE_AT_50_AGE = 50;

export type ScenarioRetirementAgeDetails = {
  earliest: RetirementAgeProjectionStats | null;
  safe: RetirementAgeProjectionStats | null;
  coast: RetirementAgeProjectionStats | null;
  retireAt50: RetirementAgeProjectionStats | null;
};

export type ScenarioProjectionViewId = "plan" | "earliest" | "safe" | "coast" | "retireAt50";

export type ScenarioProjectionView = {
  id: ScenarioProjectionViewId;
  label: string;
  subtitle: string;
  projection: ProjectionYear[];
};

export type ScenarioSummaryStats = {
  earliestRetirementAge: number | null;
  safeRetirementAge: number | null;
  coastFireAge: number | null;
  coastFireNetWorth: number | null;
  safeRetirementAmount: number | null;
  netWorthAtRetirement: number;
  netWorthAtLifeExpectancy: number;
  annualTakehome: number;
  annualContributions: number;
};

export const scenarioSummaryTooltips = {
  earliestRetirementAge:
    "The earliest age you can retire while keeping net worth positive through life expectancy. Recalculated when you save.",
  safeRetirementAge:
    "The earliest age you can retire and still have net worth at life expectancy of at least 10x your inflated annual expenses.",
  coastFireAge:
    "The earliest age you can stop saving and earn only enough to cover yearly expenses until your chosen retirement age, while net worth stays positive through life expectancy.",
  coastFireNetWorth:
    "Projected net worth in the year coast FIRE becomes possible, when income can match expenses until your chosen retirement age.",
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
  coastAgeNetWorth:
    "Projected net worth in the year you start coasting, when income matches expenses.",
  retirementAgePeakNetWorth:
    "Highest projected net worth from now through life expectancy if you retire at this age.",
  coastAgePeakNetWorth:
    "Highest projected net worth from now through life expectancy if you coast from this age until full retirement.",
  retirementAgeEndingNetWorth:
    "Projected net worth at life expectancy if you retire at this age.",
  coastAgeEndingNetWorth:
    "Projected net worth at life expectancy if you coast from this age until full retirement.",
  retireAt50:
    "Projection if you stop working at age 50, using this scenario's income, expenses, and return assumptions.",
  retireAt50NetWorth:
    "Projected net worth in the year you retire at age 50.",
  retireAt50PeakNetWorth:
    "Highest projected net worth from now through life expectancy if you retire at age 50.",
  retireAt50EndingNetWorth:
    "Projected net worth at life expectancy if you retire at age 50.",
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


export function getCurrentAgeDecimal(years: number, months: number): number {
  return years + months / 12;
}

export function isRetireAt50Applicable(config: RetirementConfig): boolean {
  const currentAge = getCurrentAgeDecimal(
    config.currentAgeYears,
    config.currentAgeMonths
  );

  return currentAge < RETIRE_AT_50_AGE && RETIRE_AT_50_AGE <= config.lifeExpectancy;
}
function getProjectionStatsAtAge(
  projection: ReturnType<typeof projectNetWorth>,
  age: number
): RetirementAgeProjectionStats {
  const agePoint =
    projection.find((row) => row.age === age) ?? projection[projection.length - 1];

  return {
    retirementAge: age,
    netWorthAtRetirement: agePoint.netWorth,
    peakNetWorth: Math.max(...projection.map((row) => row.netWorth)),
    endingNetWorth: projection[projection.length - 1].netWorth,
  };
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

  return getProjectionStatsAtAge(projection, retirementAge);
}

export function getCoastFireProjectionStats(
  config: RetirementConfig,
  coastFireAge: number | null
): RetirementAgeProjectionStats | null {
  if (coastFireAge === null) {
    return null;
  }

  const projection = projectNetWorth(config, { coastFireAge });

  if (projection.length === 0) {
    return null;
  }

  return getProjectionStatsAtAge(projection, coastFireAge);
}


export function getScenarioProjectionViews(
  config: RetirementConfig
): ScenarioProjectionView[] {
  const views: ScenarioProjectionView[] = [
    {
      id: "plan",
      label: "Your plan",
      subtitle: "Retire at " + config.retirementAge,
      projection: projectNetWorth(config),
    },
  ];

  if (config.earliestRetirementAge !== null) {
    views.push({
      id: "earliest",
      label: "Earliest retirement",
      subtitle: "Retire at " + config.earliestRetirementAge,
      projection: projectNetWorth({
        ...config,
        retirementAge: config.earliestRetirementAge,
      }),
    });
  }

  if (config.safeRetirementAge !== null) {
    views.push({
      id: "safe",
      label: "Safe retirement",
      subtitle: "Retire at " + config.safeRetirementAge,
      projection: projectNetWorth({
        ...config,
        retirementAge: config.safeRetirementAge,
      }),
    });
  }

  if (config.coastFireAge !== null) {
    views.push({
      id: "coast",
      label: "Coast FIRE",
      subtitle:
        "Coast from age " + config.coastFireAge + ", retire at " + config.retirementAge,
      projection: projectNetWorth(config, { coastFireAge: config.coastFireAge }),
    });
  }

  if (isRetireAt50Applicable(config)) {
    views.push({
      id: "retireAt50",
      label: "Retire at 50",
      subtitle: "Retire at " + RETIRE_AT_50_AGE,
      projection: projectNetWorth({
        ...config,
        retirementAge: RETIRE_AT_50_AGE,
      }),
    });
  }

  return views;
}

export function getScenarioRetirementAgeDetailsFromViews(
  views: ScenarioProjectionView[],
  config: RetirementConfig
): ScenarioRetirementAgeDetails {
  const statsForView = (
    id: ScenarioProjectionViewId,
    age: number | null
  ): RetirementAgeProjectionStats | null => {
    if (age === null) {
      return null;
    }

    const view = views.find((entry) => entry.id === id);
    if (!view || view.projection.length === 0) {
      return null;
    }

    return getProjectionStatsAtAge(view.projection, age);
  };

  return {
    earliest: statsForView("earliest", config.earliestRetirementAge),
    safe: statsForView("safe", config.safeRetirementAge),
    coast: statsForView("coast", config.coastFireAge),
    retireAt50: isRetireAt50Applicable(config)
      ? statsForView("retireAt50", RETIRE_AT_50_AGE)
      : null,
  };
}
export function getScenarioRetirementAgeDetails(
  config: RetirementConfig
): ScenarioRetirementAgeDetails {
  return getScenarioRetirementAgeDetailsFromViews(
    getScenarioProjectionViews(config),
    config
  );
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
  const coastFireStats = getCoastFireProjectionStats(config, config.coastFireAge);
  const coastFireNetWorth = coastFireStats?.netWorthAtRetirement ?? null;

  return {
    earliestRetirementAge: config.earliestRetirementAge,
    safeRetirementAge: config.safeRetirementAge,
    coastFireAge: config.coastFireAge,
    coastFireNetWorth,
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


