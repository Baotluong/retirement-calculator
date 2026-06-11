export function formatMoneyDisplay(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "" || cleaned === "-") {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
