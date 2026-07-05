import { resolveExpenseProjectionParts } from "./expenses";
import { resolvePeriodWorkingIncome, type IncomeProjectionConfig } from "./income-projection";
import type { ProjectionYear } from "./types";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

type ProjectionPeriod = {
  targetAge: number;
  fraction: number;
  isPartialYear: boolean;
  partialMonths: number;
};

export type ProjectionOptions = {
  coastFireAge?: number | null;
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

export function projectNetWorth(
  config: IncomeProjectionConfig,
  options?: ProjectionOptions
): ProjectionYear[] {
  const coastFireAge = options?.coastFireAge ?? null;
  const results: ProjectionYear[] = [];
  const startYear = new Date().getFullYear();
  const periods = getProjectionPeriods(
    config.currentAgeYears,
    config.currentAgeMonths,
    config.lifeExpectancy
  );
  const postRetirementAdditional = config.postRetirementExpenses ?? 0;

  const expenseParts = resolveExpenseProjectionParts(config);
  const currentAgeDecimal = config.currentAgeYears + config.currentAgeMonths / 12;

  let netWorth = config.currentNetWorth;
  let baseExpenses =
    expenseParts.mode === "simple" ? expenseParts.annualExpenses : expenseParts.baseAnnual;
  let deferredExpenses = 0;
  const deferredNominal =
    expenseParts.mode === "breakdown" ? expenseParts.deferredAnnual : 0;
  const startAfterYears =
    expenseParts.mode === "breakdown" ? expenseParts.startAfterYears : 0;
  let deferredActivated = startAfterYears === 0 && deferredNominal > 0;

  if (deferredActivated) {
    deferredExpenses = deferredNominal;
  }

  for (const [index, period] of periods.entries()) {
    const periodStartAge = period.targetAge - period.fraction;
    const yearsFromStart = periodStartAge - currentAgeDecimal;
    const isWorking = periodStartAge < config.retirementAge;

    if (!deferredActivated && deferredNominal > 0 && yearsFromStart >= startAfterYears) {
      deferredActivated = true;
      deferredExpenses =
        deferredNominal * Math.pow(1 + config.inflationRate, startAfterYears);
    }

    let periodExpenses = (baseExpenses + deferredExpenses) * period.fraction;

    if (!isWorking) {
      const yearsFromRetirement = periodStartAge - config.retirementAge;
      const inflatedAdditional =
        postRetirementAdditional *
        Math.pow(1 + config.inflationRate, Math.max(0, yearsFromRetirement));
      periodExpenses += inflatedAdditional * period.fraction;
    }

    const periodIncome = resolvePeriodWorkingIncome(
      config,
      periodStartAge,
      period.targetAge,
      period.fraction,
      currentAgeDecimal,
      period.isPartialYear,
      period.partialMonths,
      coastFireAge,
      periodExpenses,
      isWorking
    );

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
    baseExpenses *= inflationMultiplier;
    if (deferredActivated) {
      deferredExpenses *= inflationMultiplier;
    }
  }

  return results;
}

export function isProjectionSolvent(config: IncomeProjectionConfig): boolean {
  const projection = projectNetWorth(config);
  return projection.every((row) => row.netWorth >= 0);
}

export function findEarliestRetirementAge(
  config: IncomeProjectionConfig
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

export function isCoastProjectionSolvent(
  config: IncomeProjectionConfig,
  coastFireAge: number
): boolean {
  const projection = projectNetWorth(config, { coastFireAge });
  return projection.every((row) => row.netWorth >= 0);
}

export function findCoastFireAge(config: IncomeProjectionConfig): number | null {
  const maxCoastAge = config.retirementAge - 1;
  if (maxCoastAge < config.currentAgeYears) {
    return null;
  }

  for (let coastFireAge = config.currentAgeYears; coastFireAge <= maxCoastAge; coastFireAge += 1) {
    if (isCoastProjectionSolvent(config, coastFireAge)) {
      return coastFireAge;
    }
  }

  return null;
}

export const SAFE_RETIREMENT_EXPENSE_MULTIPLIER = 10;

function getAnnualExpensesForProjectionRow(row: ProjectionYear): number {
  const fraction = row.isPartialYear ? row.partialMonths / 12 : 1;
  return row.expenses / fraction;
}

export function getSafeRetirementThresholdAtDeath(
  config: IncomeProjectionConfig
): number {
  const projection = projectNetWorth(config);
  const endPoint = projection[projection.length - 1];
  const annualExpensesAtDeath = getAnnualExpensesForProjectionRow(endPoint);
  return SAFE_RETIREMENT_EXPENSE_MULTIPLIER * annualExpensesAtDeath;
}

export function isProjectionSafelyRetired(config: IncomeProjectionConfig): boolean {
  if (!isProjectionSolvent(config)) {
    return false;
  }

  const projection = projectNetWorth(config);
  const endPoint = projection[projection.length - 1];
  const threshold = getSafeRetirementThresholdAtDeath(config);
  return endPoint.netWorth >= threshold;
}

export function findSafeRetirementAge(
  config: IncomeProjectionConfig
): number | null {
  const minRetirementAge = config.currentAgeYears;

  for (
    let retirementAge = minRetirementAge;
    retirementAge <= config.lifeExpectancy;
    retirementAge += 1
  ) {
    if (isProjectionSafelyRetired({ ...config, retirementAge })) {
      return retirementAge;
    }
  }

  return null;
}


