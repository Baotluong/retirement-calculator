import type { RetirementConfigInput, ProjectionYear } from "./types";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

type ProjectionPeriod = {
  targetAge: number;
  fraction: number;
  isPartialYear: boolean;
  partialMonths: number;
};

function getProjectionPeriods(
  currentAgeYears: number,
  currentAgeMonths: number,
  lifeExpectancy: number
): ProjectionPeriod[] {
  const periods: ProjectionPeriod[] = [];
  const monthsRemaining =
    currentAgeMonths === 0 ? 12 : 12 - currentAgeMonths;
  const firstTargetAge = currentAgeYears + 1;

  periods.push({
    targetAge: firstTargetAge,
    fraction: monthsRemaining / 12,
    isPartialYear: monthsRemaining < 12,
    partialMonths: monthsRemaining,
  });

  for (let age = firstTargetAge + 1; age <= lifeExpectancy; age += 1) {
    periods.push({
      targetAge: age,
      fraction: 1,
      isPartialYear: false,
      partialMonths: 0,
    });
  }

  return periods;
}

export function projectNetWorth(config: RetirementConfigInput): ProjectionYear[] {
  const results: ProjectionYear[] = [];
  const startYear = new Date().getFullYear();
  const periods = getProjectionPeriods(
    config.currentAgeYears,
    config.currentAgeMonths,
    config.lifeExpectancy
  );
  const postRetirementAdditional = config.postRetirementExpenses ?? 0;
  const takehome = config.annualIncome;

  let netWorth = config.currentNetWorth;
  let expenses = config.annualExpenses;

  for (const [index, period] of periods.entries()) {
    const periodStartAge = period.targetAge - period.fraction;
    const isWorking = periodStartAge < config.retirementAge;

    const periodIncome = isWorking ? takehome * period.fraction : 0;
    let periodExpenses = expenses * period.fraction;

    if (!isWorking) {
      const yearsFromRetirement = periodStartAge - config.retirementAge;
      const inflatedAdditional =
        postRetirementAdditional *
        Math.pow(1 + config.inflationRate, Math.max(0, yearsFromRetirement));
      periodExpenses += inflatedAdditional * period.fraction;
    }

    const contributions = periodIncome - periodExpenses;
    const balanceBeforeGrowth = netWorth + contributions;
    const growth =
      balanceBeforeGrowth * config.investmentReturnRate * period.fraction;
    netWorth = balanceBeforeGrowth + growth;

    results.push({
      age: period.targetAge,
      year: startYear + index,
      netWorth: round(netWorth),
      income: round(periodIncome),
      expenses: round(periodExpenses),
      contributions: round(contributions),
      growth: round(growth),
      isPartialYear: period.isPartialYear,
      partialMonths: period.partialMonths,
    });

    const inflationMultiplier = Math.pow(
      1 + config.inflationRate,
      period.fraction
    );
    expenses *= inflationMultiplier;
  }

  return results;
}

export function isProjectionSolvent(config: RetirementConfigInput): boolean {
  const projection = projectNetWorth(config);
  return projection.every((row) => row.netWorth >= 0);
}

export function findEarliestRetirementAge(
  config: RetirementConfigInput
): number | null {
  const minRetirementAge = config.currentAgeYears;

  for (
    let retirementAge = minRetirementAge;
    retirementAge <= config.lifeExpectancy;
    retirementAge += 1
  ) {
    if (isProjectionSolvent({ ...config, retirementAge })) {
      return retirementAge;
    }
  }

  return null;
}
