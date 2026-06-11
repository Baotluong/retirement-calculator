import type { RetirementConfigInput } from "./types";
import { getCurrentAgeDecimal } from "./age";

export function validateConfigAges(data: RetirementConfigInput): string | null {
  const startAge = getCurrentAgeDecimal(data.currentAgeYears, data.currentAgeMonths);

  if (data.retirementAge < startAge) {
    return "Retirement age must be at or after current age";
  }

  if (data.lifeExpectancy < data.retirementAge) {
    return "Life expectancy must be at or after retirement age";
  }

  return null;
}
