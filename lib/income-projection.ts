import type { TakehomeCalculatorState } from "@/lib/takehome-calculator";
import { roundMoney } from "@/lib/net-worth";
import type { RetirementConfigInput } from "@/lib/types";

export type IncomeProjectionConfig = RetirementConfigInput & {
  takehomeCalculator?: TakehomeCalculatorState | null;
};

const DEFAULT_NET_TO_GROSS_RATIO = 0.72;

function getNetToGrossRatio(config: IncomeProjectionConfig): number | null {
  const calculator = config.takehomeCalculator;
  const gross = calculator?.grossSalary;

  if (!gross || gross <= 0) {
    return null;
  }

  const net = calculator?.estimate?.takeHome ?? config.annualIncome;
  if (net <= 0) {
    return null;
  }

  return net / gross;
}

export function resolveWorkingTakehomeAtYearsFromStart(
  config: IncomeProjectionConfig,
  yearsFromStart: number
): number {
  const afterYears = config.incomeIncreaseAfterYears;
  const increaseGross = config.incomeIncreaseGross ?? 0;
  const hasIncrease =
    afterYears != null &&
    afterYears >= 0 &&
    increaseGross > 0 &&
    yearsFromStart >= afterYears;

  if (!hasIncrease) {
    return config.annualIncome;
  }

  const gross = config.takehomeCalculator?.grossSalary ?? null;
  const ratio = getNetToGrossRatio(config);

  if (gross != null && gross > 0 && ratio != null) {
    return roundMoney((gross + increaseGross) * ratio);
  }

  const effectiveRatio = ratio ?? DEFAULT_NET_TO_GROSS_RATIO;
  return roundMoney(config.annualIncome + increaseGross * effectiveRatio);
}

export function resolvePeriodWorkingTakehome(
  config: IncomeProjectionConfig,
  periodStartAge: number,
  periodEndAge: number,
  currentAgeDecimal: number
): number {
  if (periodEndAge <= periodStartAge) {
    return resolveWorkingTakehomeAtYearsFromStart(
      config,
      periodStartAge - currentAgeDecimal
    );
  }

  const afterYears = config.incomeIncreaseAfterYears;
  const increaseGross = config.incomeIncreaseGross ?? 0;

  if (afterYears == null || increaseGross <= 0) {
    return resolveWorkingTakehomeAtYearsFromStart(
      config,
      periodStartAge - currentAgeDecimal
    );
  }

  const increaseAge = currentAgeDecimal + afterYears;

  if (increaseAge <= periodStartAge) {
    return resolveWorkingTakehomeAtYearsFromStart(
      config,
      periodStartAge - currentAgeDecimal
    );
  }

  if (increaseAge >= periodEndAge) {
    return resolveWorkingTakehomeAtYearsFromStart(
      config,
      periodStartAge - currentAgeDecimal
    );
  }

  const periodLength = periodEndAge - periodStartAge;
  const beforeFraction = (increaseAge - periodStartAge) / periodLength;
  const takehomeBefore = resolveWorkingTakehomeAtYearsFromStart(
    config,
    periodStartAge - currentAgeDecimal
  );
  const takehomeAfter = resolveWorkingTakehomeAtYearsFromStart(config, afterYears);

  return roundMoney(
    takehomeBefore * beforeFraction + takehomeAfter * (1 - beforeFraction)
  );
}

export function getIncomeDelayActiveFraction(
  monthsFromStart: number,
  periodMonths: number,
  delayMonths: number
): number {
  if (delayMonths <= 0 || periodMonths <= 0) {
    return 1;
  }

  if (monthsFromStart >= delayMonths) {
    return 1;
  }

  const periodEndMonths = monthsFromStart + periodMonths;

  if (periodEndMonths <= delayMonths) {
    return 0;
  }

  const activeMonths = periodEndMonths - delayMonths;
  return activeMonths / periodMonths;
}

export function resolvePeriodWorkingIncome(
  config: IncomeProjectionConfig,
  periodStartAge: number,
  periodEndAge: number,
  periodFraction: number,
  currentAgeDecimal: number,
  isPartialYear: boolean,
  partialMonths: number,
  coastFireAge: number | null,
  periodExpenses: number,
  isWorking: boolean
): number {
  if (!isWorking || periodFraction <= 0) {
    return 0;
  }

  const periodMonths =
    isPartialYear && partialMonths > 0 ? partialMonths : 12 * periodFraction;
  const monthsFromStart = Math.max(0, (periodStartAge - currentAgeDecimal) * 12);
  const delayFraction = getIncomeDelayActiveFraction(
    monthsFromStart,
    periodMonths,
    config.incomeDelayMonths ?? 0
  );

  if (delayFraction <= 0) {
    return 0;
  }

  const isCoasting = coastFireAge !== null && periodStartAge >= coastFireAge;

  if (isCoasting) {
    return roundMoney(periodExpenses * delayFraction);
  }

  const annualTakehome = resolvePeriodWorkingTakehome(
    config,
    periodStartAge,
    periodEndAge,
    currentAgeDecimal
  );

  return roundMoney(annualTakehome * periodFraction * delayFraction);
}