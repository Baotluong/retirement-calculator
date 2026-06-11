export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;

export function parseCompareIds(
  raw: string | string[] | undefined
): number[] | null {
  const parts: string[] = [];

  if (Array.isArray(raw)) {
    for (const value of raw) {
      if (typeof value === "string" && value.trim()) {
        parts.push(...value.split(","));
      }
    }
  } else if (typeof raw === "string" && raw.trim()) {
    parts.push(...raw.split(","));
  }

  const ids = parts
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  const unique = Array.from(new Set(ids));
  if (unique.length < MIN_COMPARE || unique.length > MAX_COMPARE) {
    return null;
  }

  return unique;
}
