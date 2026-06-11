"use client";

import { useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import {
  RECURRING_MONTHLY_EXPENSE_MONTH,
  YEARLY_EXPENSE_MONTH,
  calculateActiveExpenseYearlySum,
  calculateExpenseBreakdownTotals,
  getMonthName,
  getRecurringMonthlyExpenseAmount,
  getYearlyExpenseAmount,
  hasOptionalExpenseRows,
  normalizeExpenseBreakdown,
  normalizeMonthlyExpenseBreakdown,
} from "@/lib/expenses";
import { formatMoneyDisplay } from "@/lib/money-format";
import { roundMoney } from "@/lib/net-worth";
import type { ExpenseMonthInput } from "@/lib/types";

type ExpensesBreakdownModalProps = {
  isOpen: boolean;
  months: ExpenseMonthInput[];
  optionalExpensesStartAfterYears?: number;
  onClose: () => void;
  onApply: (
    months: ExpenseMonthInput[],
    yearlySum: number,
    optionalExpensesStartAfterYears?: number
  ) => void;
};

export function ExpensesBreakdownModal({
  isOpen,
  months,
  optionalExpensesStartAfterYears,
  onClose,
  onApply,
}: ExpensesBreakdownModalProps) {
  const [draftMonths, setDraftMonths] = useState<ExpenseMonthInput[]>(
    normalizeMonthlyExpenseBreakdown(months)
  );
  const [yearlyExpense, setYearlyExpense] = useState(0);
  const [recurringMonthlyExpense, setRecurringMonthlyExpense] = useState(0);
  const [startAfterYearsInput, setStartAfterYearsInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDraftMonths(normalizeMonthlyExpenseBreakdown(months));
      setYearlyExpense(getYearlyExpenseAmount(months));
      setRecurringMonthlyExpense(getRecurringMonthlyExpenseAmount(months));
      setStartAfterYearsInput(
        optionalExpensesStartAfterYears && optionalExpensesStartAfterYears > 0
          ? String(optionalExpensesStartAfterYears)
          : ""
      );
    }
  }, [isOpen, months, optionalExpensesStartAfterYears]);

  const draftItems = useMemo(() => {
    const extras: ExpenseMonthInput[] = [];

    if (yearlyExpense > 0) {
      extras.push({ month: YEARLY_EXPENSE_MONTH, amount: yearlyExpense });
    }

    if (recurringMonthlyExpense > 0) {
      extras.push({
        month: RECURRING_MONTHLY_EXPENSE_MONTH,
        amount: recurringMonthlyExpense,
      });
    }

    return normalizeExpenseBreakdown([...draftMonths, ...extras]);
  }, [draftMonths, yearlyExpense, recurringMonthlyExpense]);

  const parsedStartAfterYears = useMemo(() => {
    const trimmed = startAfterYearsInput.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return undefined;
    }

    return parsed;
  }, [startAfterYearsInput]);

  const {
    yearlySum,
    monthlyAvg,
    monthlyYearlySum,
    recurringMonthlyYearly,
    deferredYearlySum,
  } = useMemo(() => calculateExpenseBreakdownTotals(draftItems), [draftItems]);

  const activeYearlySum = useMemo(
    () =>
      calculateActiveExpenseYearlySum(draftItems, parsedStartAfterYears),
    [draftItems, parsedStartAfterYears]
  );

  const showOptionalDeferral = hasOptionalExpenseRows(draftItems);

  if (!isOpen) {
    return null;
  }

  function updateMonthAmount(month: number, amount: number) {
    setDraftMonths((current) =>
      current.map((row) => (row.month === month ? { ...row, amount } : row))
    );
  }

  function handleApply() {
    onApply(
      draftItems,
      roundMoney(activeYearlySum),
      parsedStartAfterYears
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40"
        aria-label="Close expenses breakdown"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="shrink-0 border-b border-zinc-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Expenses breakdown</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Enter monthly spending plus optional yearly or flat monthly expenses.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_160px] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <span>Month</span>
              <span>Amount</span>
            </div>

            {draftMonths.map((row) => (
              <div
                key={row.month}
                className="grid grid-cols-[1fr_160px] gap-3 items-center"
              >
                <span className="text-sm font-medium text-zinc-800">
                  {getMonthName(row.month)}
                </span>
                <MoneyInput
                  value={row.amount}
                  onChange={(value) => updateMonthAmount(row.month, value ?? 0)}
                  min={0}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4 border-t border-zinc-100 pt-4">
            <div className="grid grid-cols-[1fr_160px] gap-3 items-center">
              <div>
                <span className="text-sm font-medium text-zinc-800">
                  {getMonthName(RECURRING_MONTHLY_EXPENSE_MONTH)} (optional)
                </span>
                <p className="mt-1 text-xs text-zinc-500">
                  Same amount every month. Multiplied by 12 in the yearly sum.
                </p>
              </div>
              <MoneyInput
                value={recurringMonthlyExpense > 0 ? recurringMonthlyExpense : undefined}
                onChange={(value) => setRecurringMonthlyExpense(value ?? 0)}
                min={0}
                optional
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-[1fr_160px] gap-3 items-center">
              <div>
                <span className="text-sm font-medium text-zinc-800">
                  {getMonthName(YEARLY_EXPENSE_MONTH)} (optional)
                </span>
                <p className="mt-1 text-xs text-zinc-500">
                  One-time or annual costs not spread across months.
                </p>
              </div>
              <MoneyInput
                value={yearlyExpense > 0 ? yearlyExpense : undefined}
                onChange={(value) => setYearlyExpense(value ?? 0)}
                min={0}
                optional
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            {showOptionalDeferral ? (
              <div className="grid grid-cols-[1fr_160px] gap-3 items-center">
                <div>
                  <span className="text-sm font-medium text-zinc-800">
                    Start optional expenses after (years)
                  </span>
                  <p className="mt-1 text-xs text-zinc-500">
                    Applies to the optional monthly and yearly rows above. Leave blank to include them now.
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={startAfterYearsInput}
                  onChange={(event) => setStartAfterYearsInput(event.target.value)}
                  placeholder="Now"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 px-4 py-3">
              <span className="block text-sm font-medium text-zinc-700">Yearly sum (when all active)</span>
              <span className="mt-1 block text-lg font-semibold text-zinc-900">
                {formatMoneyDisplay(yearlySum)}
              </span>
              {recurringMonthlyExpense > 0 ? (
                <span className="mt-1 block text-xs text-zinc-500">
                  Includes {formatMoneyDisplay(recurringMonthlyYearly)} from monthly expense
                </span>
              ) : null}
              {yearlyExpense > 0 ? (
                <span className="mt-1 block text-xs text-zinc-500">
                  Includes {formatMoneyDisplay(yearlyExpense)} yearly expense
                </span>
              ) : null}
            </div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3">
              <span className="block text-sm font-medium text-zinc-700">Active now</span>
              <span className="mt-1 block text-lg font-semibold text-zinc-900">
                {formatMoneyDisplay(activeYearlySum)}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {parsedStartAfterYears && parsedStartAfterYears > 0 && deferredYearlySum > 0
                  ? `Optional expenses of ${formatMoneyDisplay(deferredYearlySum)} begin in ${parsedStartAfterYears} year${parsedStartAfterYears === 1 ? "" : "s"}`
                  : `Based on calendar months totaling ${formatMoneyDisplay(monthlyYearlySum)}`}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Apply to annual expenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}