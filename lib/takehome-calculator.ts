import type { TakehomeFilingStatus } from "@/lib/takehome-estimate";

export type TakehomeBreakdownLine = {
  label: string;
  amount: number;
};

export type TakehomeEstimateResult = {
  takeHome: number;
  breakdown: TakehomeBreakdownLine[];
  source: "payrolltax" | "fallback";
  fallbackReason?: string;
};

export type TakehomeCalculatorState = {
  grossSalary: number;
  filingStatus: TakehomeFilingStatus;
  state: string;
  cityId: string;
  estimate: TakehomeEstimateResult | null;
};

export const DEFAULT_TAKEHOME_CALCULATOR_STATE: TakehomeCalculatorState = {
  grossSalary: 120000,
  filingStatus: "single",
  state: "CA",
  cityId: "",
  estimate: null,
};

type TakehomeCalculatorRow = {
  takehomeGrossSalary: number | null;
  takehomeFilingStatus: string | null;
  takehomeState: string | null;
  takehomeCityId: string | null;
  takehomeEstimateJson: string | null;
};

function isFilingStatus(value: unknown): value is TakehomeFilingStatus {
  return value === "single" || value === "married";
}

function isEstimateResult(value: unknown): value is TakehomeEstimateResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const source = record.source;
  const takeHome = record.takeHome;
  const breakdown = record.breakdown;

  if (typeof takeHome !== "number" || !Number.isFinite(takeHome)) {
    return false;
  }

  if (source !== "payrolltax" && source !== "fallback") {
    return false;
  }

  if (!Array.isArray(breakdown)) {
    return false;
  }

  return breakdown.every(
    (line) =>
      line &&
      typeof line === "object" &&
      typeof (line as TakehomeBreakdownLine).label === "string" &&
      typeof (line as TakehomeBreakdownLine).amount === "number"
  );
}

export function parseTakehomeCalculatorFromRow(
  row: TakehomeCalculatorRow
): TakehomeCalculatorState | null {
  if (
    row.takehomeGrossSalary === null ||
    !row.takehomeFilingStatus ||
    !row.takehomeState
  ) {
    return null;
  }

  if (!isFilingStatus(row.takehomeFilingStatus)) {
    return null;
  }

  let estimate: TakehomeEstimateResult | null = null;
  if (row.takehomeEstimateJson) {
    try {
      const parsed = JSON.parse(row.takehomeEstimateJson) as unknown;
      if (isEstimateResult(parsed)) {
        estimate = parsed;
      }
    } catch {
      estimate = null;
    }
  }

  return {
    grossSalary: row.takehomeGrossSalary,
    filingStatus: row.takehomeFilingStatus,
    state: row.takehomeState.toUpperCase(),
    cityId: row.takehomeCityId ?? "",
    estimate,
  };
}

export function takehomeCalculatorToRowValues(
  calculator: TakehomeCalculatorState | null | undefined
) {
  if (!calculator) {
    return {
      takehomeGrossSalary: null,
      takehomeFilingStatus: null,
      takehomeState: null,
      takehomeCityId: null,
      takehomeEstimateJson: null,
    };
  }

  return {
    takehomeGrossSalary: calculator.grossSalary,
    takehomeFilingStatus: calculator.filingStatus,
    takehomeState: calculator.state.toUpperCase(),
    takehomeCityId: calculator.cityId || null,
    takehomeEstimateJson: calculator.estimate
      ? JSON.stringify(calculator.estimate)
      : null,
  };
}

export function resolveTakehomeCalculatorState(
  saved: TakehomeCalculatorState | null | undefined
): TakehomeCalculatorState {
  return saved ?? DEFAULT_TAKEHOME_CALCULATOR_STATE;
}