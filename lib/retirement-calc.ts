import { findCoastFireAge, findEarliestRetirementAge, findSafeRetirementAge } from "./projection";
import type { RetirementConfigInput } from "./types";

type RetirementCalcValidation = {
  ready: boolean;
  missingFields: string[];
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateRetirementCalculation(
  form: RetirementConfigInput
): RetirementCalcValidation {
  const missingFields: string[] = [];

  if (!isValidNumber(form.currentAgeYears)) {
    missingFields.push("Current age (years)");
  }

  if (!isValidNumber(form.currentAgeMonths)) {
    missingFields.push("Current age (months)");
  } else if (form.currentAgeMonths < 0 || form.currentAgeMonths > 11) {
    missingFields.push("Current age (months between 0 and 11)");
  }

  if (!isValidNumber(form.lifeExpectancy)) {
    missingFields.push("Life expectancy");
  } else if (
    isValidNumber(form.currentAgeYears) &&
    form.lifeExpectancy <= form.currentAgeYears
  ) {
    missingFields.push("Life expectancy greater than current age");
  }

  if (!isValidNumber(form.currentNetWorth) || form.currentNetWorth < 0) {
    missingFields.push("Current net worth");
  }

  if (!isValidNumber(form.annualIncome) || form.annualIncome < 0) {
    missingFields.push("Annual takehome");
  }

  if (!isValidNumber(form.annualExpenses) || form.annualExpenses < 0) {
    missingFields.push("Annual expenses");
  }

  if (
    !isValidNumber(form.investmentReturnRate) ||
    form.investmentReturnRate < 0 ||
    form.investmentReturnRate > 1
  ) {
    missingFields.push("Investment return");
  }

  if (
    !isValidNumber(form.inflationRate) ||
    form.inflationRate < 0 ||
    form.inflationRate > 1
  ) {
    missingFields.push("Inflation rate");
  }

  if (
    form.postRetirementExpenses !== undefined &&
    !isValidNumber(form.postRetirementExpenses)
  ) {
    missingFields.push("Post-retirement expenses (additional)");
  }

  return {
    ready: missingFields.length === 0,
    missingFields,
  };
}

export type RetirementAgesPreview = {
  earliestRetirementAge: number | null;
  safeRetirementAge: number | null;
  coastFireAge: number | null;
};

export function computeRetirementAgesPreview(
  form: RetirementConfigInput
): RetirementAgesPreview {
  const validation = validateRetirementCalculation(form);
  if (!validation.ready) {
    return {
      earliestRetirementAge: null,
      safeRetirementAge: null,
      coastFireAge: null,
    };
  }

  return {
    earliestRetirementAge: findEarliestRetirementAge(form),
    safeRetirementAge: findSafeRetirementAge(form),
    coastFireAge: findCoastFireAge(form),
  };
}

export function computeEarliestRetirementAge(
  form: RetirementConfigInput
): number | null {
  const validation = validateRetirementCalculation(form);
  if (!validation.ready) {
    return null;
  }

  return findEarliestRetirementAge(form);
}

export function computeSafeRetirementAge(
  form: RetirementConfigInput
): number | null {
  const validation = validateRetirementCalculation(form);
  if (!validation.ready) {
    return null;
  }

  return findSafeRetirementAge(form);
}

export function computeCoastFireAge(form: RetirementConfigInput): number | null {
  const validation = validateRetirementCalculation(form);
  if (!validation.ready) {
    return null;
  }

  return findCoastFireAge(form);
}
