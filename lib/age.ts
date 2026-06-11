export function getCurrentAgeDecimal(years: number, months: number): number {
  return years + months / 12;
}

export function formatCurrentAge(years: number, months: number): string {
  if (months === 0) {
    return `${years}`;
  }
  return `${years}y ${months}m`;
}

export function formatProjectionAge(age: number): string {
  return `${age}`;
}

export function formatPartialYearLabel(partialMonths: number): string {
  return `${partialMonths} mo partial`;
}
