import { roundToCents } from "./money-format";
import type { ExpenseMonthInput, RetirementConfigInput } from "./types";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Sentinel month for the optional once-per-year expense row. */
export const YEARLY_EXPENSE_MONTH = 13;

/** Sentinel month for an optional flat monthly expense (amount x 12). */
export const RECURRING_MONTHLY_EXPENSE_MONTH = 14;

export function isYearlyExpenseRow(item: ExpenseMonthInput): boolean {
  return item.month === YEARLY_EXPENSE_MONTH;
}

export function isRecurringMonthlyExpenseRow(item: ExpenseMonthInput): boolean {
  return item.month === RECURRING_MONTHLY_EXPENSE_MONTH;
}

export function isCalendarMonthRow(item: ExpenseMonthInput): boolean {
  return item.month >= 1 && item.month <= 12;
}

export function stripSpecialExpenseRows(items: ExpenseMonthInput[]): ExpenseMonthInput[] {
  return items.filter(isCalendarMonthRow);
}

export function getYearlyExpenseAmount(items: ExpenseMonthInput[]): number {
  return items.find(isYearlyExpenseRow)?.amount ?? 0;
}

export function getRecurringMonthlyExpenseAmount(items: ExpenseMonthInput[]): number {
  return items.find(isRecurringMonthlyExpenseRow)?.amount ?? 0;
}

export function normalizeMonthlyExpenseBreakdown(
  items: ExpenseMonthInput[]
): ExpenseMonthInput[] {
  const amountsByMonth = new Map(
    stripSpecialExpenseRows(items).map((item) => [item.month, item.amount])
  );

  return MONTH_NAMES.map((_, index) => ({
    month: index + 1,
    amount: amountsByMonth.get(index + 1) ?? 0,
  }));
}

export function normalizeExpenseBreakdown(
  items: ExpenseMonthInput[]
): ExpenseMonthInput[] {
  const monthly = normalizeMonthlyExpenseBreakdown(items);
  const yearlyAmount = getYearlyExpenseAmount(items);
  const recurringMonthlyAmount = getRecurringMonthlyExpenseAmount(items);
  const extras: ExpenseMonthInput[] = [];

  if (yearlyAmount > 0) {
    extras.push({
      month: YEARLY_EXPENSE_MONTH,
      amount: roundToCents(yearlyAmount),
    });
  }

  if (recurringMonthlyAmount > 0) {
    extras.push({
      month: RECURRING_MONTHLY_EXPENSE_MONTH,
      amount: roundToCents(recurringMonthlyAmount),
    });
  }

  return extras.length > 0 ? [...monthly, ...extras] : monthly;
}

export function createDefaultExpenseBreakdown(
  monthlyAmount = 75000 / 12
): ExpenseMonthInput[] {
  return MONTH_NAMES.map((_, index) => ({
    month: index + 1,
    amount: roundToCents(monthlyAmount),
  }));
}

export const defaultExpenseBreakdown = createDefaultExpenseBreakdown();

export function getDeferredExpenseYearlyAmount(items: ExpenseMonthInput[]): number {
  const yearlyExpense = getYearlyExpenseAmount(items);
  const recurringMonthlyExpense = getRecurringMonthlyExpenseAmount(items);
  return roundToCents(yearlyExpense + roundToCents(recurringMonthlyExpense * 12));
}

export function getBaseCalendarExpenseYearlyAmount(items: ExpenseMonthInput[]): number {
  const monthly = normalizeMonthlyExpenseBreakdown(items);
  return roundToCents(monthly.reduce((sum, item) => sum + item.amount, 0));
}

export function hasOptionalExpenseRows(items: ExpenseMonthInput[]): boolean {
  return getDeferredExpenseYearlyAmount(items) > 0;
}

export function calculateExpenseBreakdownTotals(items: ExpenseMonthInput[]) {
  const monthly = normalizeMonthlyExpenseBreakdown(items);
  const yearlyExpense = getYearlyExpenseAmount(items);
  const recurringMonthlyExpense = getRecurringMonthlyExpenseAmount(items);
  const recurringMonthlyYearly = roundToCents(recurringMonthlyExpense * 12);
  const monthlyYearlySum = roundToCents(
    monthly.reduce((sum, item) => sum + item.amount, 0)
  );
  const deferredYearlySum = roundToCents(yearlyExpense + recurringMonthlyYearly);
  const yearlySum = roundToCents(monthlyYearlySum + deferredYearlySum);
  const monthlyAvg = roundToCents(monthlyYearlySum / 12);

  return {
    yearlySum,
    monthlyAvg,
    yearlyExpense,
    recurringMonthlyExpense,
    recurringMonthlyYearly,
    monthlyYearlySum,
    deferredYearlySum,
  };
}

export function calculateActiveExpenseYearlySum(
  items: ExpenseMonthInput[],
  optionalExpensesStartAfterYears?: number | null
): number {
  const totals = calculateExpenseBreakdownTotals(items);
  const startAfterYears = optionalExpensesStartAfterYears ?? 0;

  if (startAfterYears <= 0 || totals.deferredYearlySum <= 0) {
    return totals.yearlySum;
  }

  return totals.monthlyYearlySum;
}

export type ExpenseProjectionParts =
  | {
      mode: "simple";
      annualExpenses: number;
    }
  | {
      mode: "breakdown";
      baseAnnual: number;
      deferredAnnual: number;
      startAfterYears: number;
    };

export function resolveExpenseProjectionParts(
  config: RetirementConfigInput
): ExpenseProjectionParts {
  const hasBreakdown = Boolean(
    config.expenseBreakdown?.some((item) => item.amount > 0)
  );

  if (!hasBreakdown || !config.expenseBreakdown) {
    return {
      mode: "simple",
      annualExpenses: config.annualExpenses,
    };
  }

  return {
    mode: "breakdown",
    baseAnnual: getBaseCalendarExpenseYearlyAmount(config.expenseBreakdown),
    deferredAnnual: getDeferredExpenseYearlyAmount(config.expenseBreakdown),
    startAfterYears: config.optionalExpensesStartAfterYears ?? 0,
  };
}

export function getMonthName(month: number): string {
  if (month === YEARLY_EXPENSE_MONTH) {
    return "Yearly expense";
  }

  if (month === RECURRING_MONTHLY_EXPENSE_MONTH) {
    return "Monthly expense";
  }

  return MONTH_NAMES[month - 1] ?? "Month " + month;
}