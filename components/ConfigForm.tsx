"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoneyField, MoneyInput } from "@/components/MoneyInput";
import { ExpensesBreakdownModal } from "@/components/ExpensesBreakdownModal";
import { NetWorthCalculatorModal } from "@/components/NetWorthCalculatorModal";
import { TakehomeCalculatorModal } from "@/components/TakehomeCalculatorModal";
import { InfoTooltip } from "@/components/InfoTooltip";
import { getSafeRetirementThresholdAtDeath } from "@/lib/projection";
import { formatSafeRetirementAgeTooltip } from "@/lib/scenario-summary";
import { formatMoneyDisplay } from "@/lib/money-format";
import { calculateActiveExpenseYearlySum, calculateExpenseBreakdownTotals, normalizeExpenseBreakdown } from "@/lib/expenses";
import { calculateNetWorthSum, roundMoney } from "@/lib/net-worth";
import type {
  ExpenseMonthInput,
  NetWorthItemInput,
  NetWorthRow,
  RetirementConfig,
  RetirementConfigInput,
} from "@/lib/types";

type ConfigFormProps = {
  initialValues?: RetirementConfig;
  prefill?: RetirementConfigInput;
  initialNetWorthBreakdown?: NetWorthItemInput[];
  initialExpenseBreakdown?: ExpenseMonthInput[];
  readOnly?: boolean;
};

const defaultValues: RetirementConfigInput = {
  name: "",
  description: "",
  location: "",
  currentAgeYears: 35,
  currentAgeMonths: 0,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentNetWorth: 100000,
  annualIncome: 120000,
  annualExpenses: 80000,
  investmentReturnRate: 0.06,
  inflationRate: 0.033,
  postRetirementExpenses: 0,
  optionalExpensesStartAfterYears: undefined,
};

function formatSaveError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "fieldErrors" in error) {
    const fieldErrors = (error as { fieldErrors: Record<string, string[] | undefined> })
      .fieldErrors;
    const messages = Object.entries(fieldErrors).flatMap(([field, issues]) =>
      (issues ?? []).map((issue) => field + ": " + issue)
    );

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  return "Failed to save scenario";
}

function toFormState(
  config?: RetirementConfig | RetirementConfigInput
): RetirementConfigInput {
  if (!config) return defaultValues;
  return {
    name: config.name,
    description: config.description ?? "",
    location: config.location ?? "",
    currentAgeYears: config.currentAgeYears,
    currentAgeMonths: config.currentAgeMonths,
    retirementAge: config.retirementAge,
    lifeExpectancy: config.lifeExpectancy,
    currentNetWorth: config.currentNetWorth,
    annualIncome: config.annualIncome,
    annualExpenses: config.annualExpenses,
    investmentReturnRate: config.investmentReturnRate,
    inflationRate: config.inflationRate,
    postRetirementExpenses: config.postRetirementExpenses,
    optionalExpensesStartAfterYears: config.optionalExpensesStartAfterYears,
  };
}

function toNetWorthRows(items: NetWorthItemInput[]): NetWorthRow[] {
  return items.map((item) => ({
    ...item,
    clientId: crypto.randomUUID(),
  }));
}

function toBreakdownPayload(rows: NetWorthRow[]): NetWorthItemInput[] {
  return rows
    .filter((row) => row.name.trim().length > 0)
    .map(({ name, entryType, amount }) => ({
      name: name.trim(),
      entryType,
      amount,
    }));
}

export function ConfigForm({
  initialValues,
  prefill,
  initialNetWorthBreakdown = [],
  initialExpenseBreakdown = [],
  readOnly = false,
}: ConfigFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<RetirementConfigInput>(
    () => toFormState(initialValues ?? prefill)
  );
  const [netWorthRows, setNetWorthRows] = useState<NetWorthRow[]>(() =>
    toNetWorthRows(
      initialValues?.netWorthBreakdown?.length
        ? initialValues.netWorthBreakdown
        : initialNetWorthBreakdown
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [netWorthModalOpen, setNetWorthModalOpen] = useState(false);
  const [expenseMonths, setExpenseMonths] = useState<ExpenseMonthInput[]>(() =>
    normalizeExpenseBreakdown(
      initialValues?.expenseBreakdown?.some((item) => item.amount > 0)
        ? initialValues.expenseBreakdown
        : initialExpenseBreakdown
    )
  );
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);
  const [takehomeModalOpen, setTakehomeModalOpen] = useState(false);
  const [previewAges, setPreviewAges] = useState<{
    earliestRetirementAge: number | null;
    safeRetirementAge: number | null;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isEditing = Boolean(initialValues);
  const fieldClass = readOnly
    ? "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800"
    : "w-full rounded-lg border border-zinc-300 px-3 py-2";

  function updateField<K extends keyof RetirementConfigInput>(
    key: K,
    value: RetirementConfigInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleApplyNetWorth(rows: NetWorthRow[], total: number) {
    setNetWorthRows(rows);
    updateField("currentNetWorth", Math.max(0, roundMoney(total)));
  }

  function handleApplyExpenses(
    months: ExpenseMonthInput[],
    yearlySum: number,
    optionalExpensesStartAfterYears?: number
  ) {
    setExpenseMonths(months);
    updateField("annualExpenses", Math.max(0, roundMoney(yearlySum)));
    updateField("optionalExpensesStartAfterYears", optionalExpensesStartAfterYears);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        description: form.description?.trim() || undefined,
        location: form.location?.trim() || undefined,
        netWorthBreakdown: toBreakdownPayload(netWorthRows),
        expenseBreakdown: expenseMonths,
        optionalExpensesStartAfterYears: form.optionalExpensesStartAfterYears,
      };

      const url = isEditing
        ? "/api/configurations/" + initialValues!.id
        : "/api/configurations";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(formatSaveError(data.error));
        return;
      }

      setPreviewAges(null);

      if (isEditing) {
        router.refresh();
        return;
      }

      router.push("/configurations/" + data.id);
    } catch {
      setError("Failed to save scenario");
    } finally {
      setSaving(false);
    }
  }

  const breakdownTotal = roundMoney(calculateNetWorthSum(toBreakdownPayload(netWorthRows)));
  const expenseTotals = calculateExpenseBreakdownTotals(expenseMonths);

  const displayedEarliestRetirementAge =
    previewAges?.earliestRetirementAge ?? initialValues?.earliestRetirementAge ?? null;
  const displayedSafeRetirementAge =
    previewAges?.safeRetirementAge ?? initialValues?.safeRetirementAge ?? null;
  const safeRetirementAmount =
    displayedSafeRetirementAge !== null
      ? getSafeRetirementThresholdAtDeath({
          ...form,
          expenseBreakdown: expenseMonths,
          retirementAge: displayedSafeRetirementAge,
        })
      : null;
  const safeRetirementTooltip = formatSafeRetirementAgeTooltip(safeRetirementAmount);
  const previewHelperText = previewAges
    ? "Preview from current form values (not saved)."
    : undefined;

  async function handlePreviewAges() {
    setPreviewing(true);
    setPreviewError(null);

    try {
      const response = await fetch("/api/retirement-ages/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description?.trim() || undefined,
          location: form.location?.trim() || undefined,
          expenseBreakdown: expenseMonths,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPreviewError(formatSaveError(data.error));
        return;
      }

      setPreviewAges({
        earliestRetirementAge: data.earliestRetirementAge ?? null,
        safeRetirementAge: data.safeRetirementAge ?? null,
      });
    } catch {
      setPreviewError("Failed to preview retirement ages");
    } finally {
      setPreviewing(false);
    }
  }

  const formClassName = "space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm";

  const formContent = (
    <>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Scenario name</span>
            <input
              className={fieldClass}
              value={form.name}
              readOnly={readOnly}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Description</span>
            <textarea
              className={fieldClass}
              rows={3}
              readOnly={readOnly}
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Optional notes about this scenario"
            />
          </label>


          <div className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Current age</span>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Years"
                value={form.currentAgeYears}
                onChange={(v) => updateField("currentAgeYears", v)}
                readOnly={readOnly}
                fieldClass={fieldClass}
              />
              <NumberField
                label="Months"
                value={form.currentAgeMonths}
                onChange={(v) => updateField("currentAgeMonths", v)}
                min={0}
                max={11}
                readOnly={readOnly}
                fieldClass={fieldClass}
              />
            </div>
          </div>

          <NumberField
            label="Life expectancy"
            value={form.lifeExpectancy}
            onChange={(v) => updateField("lifeExpectancy", v)}
            readOnly={readOnly}
            fieldClass={fieldClass}
          />

          <div className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Current net worth</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <MoneyInput
                value={form.currentNetWorth}
                onChange={(value) => updateField("currentNetWorth", value ?? 0)}
                min={0}
                required
                readOnly={readOnly}
              />
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => setNetWorthModalOpen(true)}
                  className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Calculate net worth
                </button>
              ) : null}
            </div>
            {toBreakdownPayload(netWorthRows).length > 0 ? (
              <span className="mt-1 block text-xs text-zinc-500">
                Breakdown total: {formatMoneyDisplay(breakdownTotal)}
              </span>
            ) : null}
          </div>

          <div className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Annual takehome</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <MoneyInput
                value={form.annualIncome}
                onChange={(value) => updateField("annualIncome", value ?? 0)}
                min={0}
                required
                readOnly={readOnly}
              />
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => setTakehomeModalOpen(true)}
                  className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Calculate takehome
                </button>
              ) : null}
            </div>
            {form.location?.trim() ? (
              <span className="mt-1 block text-xs text-zinc-500">
                Location: {form.location}
                {!readOnly ? " (set from take-home calculator)" : ""}
              </span>
            ) : !readOnly ? (
              <span className="mt-1 block text-xs text-zinc-500">
                Post-tax income you bring home each year. Location is set when you use the take-home calculator.
              </span>
            ) : null}
          </div>

          <div className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Annual expenses</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <MoneyInput
                value={form.annualExpenses}
                onChange={(value) => updateField("annualExpenses", value ?? 0)}
                min={0}
                required
                readOnly={readOnly}
              />
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => setExpensesModalOpen(true)}
                  className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Calculate expenses
                </button>
              ) : null}
            </div>
            {expenseMonths.some((item) => item.amount > 0) ? (
              <span className="mt-1 block text-xs text-zinc-500">
                Breakdown yearly sum: {formatMoneyDisplay(expenseTotals.yearlySum)}
                {expenseTotals.recurringMonthlyYearly > 0
                  ? " (includes " +
                    formatMoneyDisplay(expenseTotals.recurringMonthlyYearly) +
                    " from monthly)"
                  : ""}
                {expenseTotals.yearlyExpense > 0
                  ? " (includes " + formatMoneyDisplay(expenseTotals.yearlyExpense) + " yearly)"
                  : ""}
                {" - "}Monthly avg: {formatMoneyDisplay(expenseTotals.monthlyAvg)}
              </span>
            ) : null}
          </div>

          <MoneyField
            label="Post-retirement expenses (additional)"
            value={form.postRetirementExpenses}
            onChange={(value) => updateField("postRetirementExpenses", value)}
            optional
            allowNegative
            readOnly={readOnly}
            helperText="Added on top of annual expenses after retirement. Use a negative value for lifestyle decreases."
          />

          <PercentField
            label="Investment return"
            value={form.investmentReturnRate}
            onChange={(v) => updateField("investmentReturnRate", v)}
            readOnly={readOnly}
            fieldClass={fieldClass}
          />
          <PercentField
            label="Inflation rate"
            value={form.inflationRate}
            onChange={(v) => updateField("inflationRate", v)}
            decimals={3}
            readOnly={readOnly}
            fieldClass={fieldClass}
          />

          <NumberField
            label="Retirement age"
            value={form.retirementAge}
            onChange={(value) => updateField("retirementAge", value)}
            min={18}
            max={100}
            readOnly={readOnly}
            fieldClass={fieldClass}
          />

          <ReadOnlyAgeField
            label="Earliest retirement age"
            value={displayedEarliestRetirementAge}
            helperText={
              readOnly
                ? undefined
                : previewHelperText ??
                  (initialValues || prefill
                    ? displayedEarliestRetirementAge === null
                      ? "Unable to calculate with the current assumptions."
                      : "Recalculated automatically whenever you save."
                    : "Calculated automatically when you save or preview.")
            }
          />

          <ReadOnlyAgeField
            label="Safe retirement age"
            value={displayedSafeRetirementAge}
            tooltip={safeRetirementTooltip}
            helperText={
              readOnly
                ? undefined
                : previewHelperText ??
                  (initialValues || prefill
                    ? displayedSafeRetirementAge === null
                      ? "Unable to calculate with the current assumptions."
                      : "Recalculated automatically whenever you save."
                    : "Calculated automatically when you save or preview.")
            }
          />
        </div>

        {!readOnly && error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!readOnly && previewError ? (
          <p className="text-sm text-amber-700">{previewError}</p>
        ) : null}

        {!readOnly ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : prefill
                    ? "Create clone"
                    : "Create scenario"}
            </button>
            <button
              type="button"
              onClick={handlePreviewAges}
              disabled={previewing || saving}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              {previewing ? "Previewing..." : "Preview retirement ages"}
            </button>
          </div>
        ) : null}
    </>
  );

  return (
    <>
      {readOnly ? (
        <div className={formClassName}>{formContent}</div>
      ) : (
        <form onSubmit={handleSubmit} className={formClassName}>
          {formContent}
        </form>
      )}

      {!readOnly ? (
        <>
          <NetWorthCalculatorModal
            isOpen={netWorthModalOpen}
            rows={netWorthRows}
            onClose={() => setNetWorthModalOpen(false)}
            onApply={handleApplyNetWorth}
          />

          <ExpensesBreakdownModal
            isOpen={expensesModalOpen}
            months={expenseMonths}
            optionalExpensesStartAfterYears={form.optionalExpensesStartAfterYears}
            onClose={() => setExpensesModalOpen(false)}
            onApply={handleApplyExpenses}
          />

          <TakehomeCalculatorModal
            isOpen={takehomeModalOpen}
            onClose={() => setTakehomeModalOpen(false)}
            onApply={({ takeHome, location }) => {
              updateField("annualIncome", takeHome);
              updateField("location", location);
            }}
          />
        </>
      ) : null}
    </>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  readOnly?: boolean;
  fieldClass?: string;
};

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  readOnly = false,
  fieldClass = "w-full rounded-lg border border-zinc-300 px-3 py-2",
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        className={fieldClass}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      />
    </label>
  );
}

type PercentFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  readOnly?: boolean;
  fieldClass?: string;
};

function PercentField({
  label,
  value,
  onChange,
  decimals = 2,
  readOnly = false,
  fieldClass = "w-full rounded-lg border border-zinc-300 px-3 py-2",
}: PercentFieldProps) {
  const step = decimals === 3 ? "0.001" : "0.01";
  const example = decimals === 3 ? "0.025 for 2.5%" : "0.07 for 7%";

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        type="number"
        step={step}
        min="0"
        max="1"
        className={fieldClass}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      />
      {!readOnly ? (
        <span className="mt-1 block text-xs text-zinc-500">Decimal format, e.g. {example}</span>
      ) : null}
    </label>
  );
}

type ReadOnlyAgeFieldProps = {
  label: string;
  value: number | null;
  helperText?: string;
  tooltip?: string;
};

function ReadOnlyAgeField({ label, value, helperText, tooltip }: ReadOnlyAgeFieldProps) {
  const displayValue = value === null ? "-" : String(value);

  return (
    <div className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {tooltip ? <InfoTooltip text={tooltip} /> : null}
        </span>
      </span>
      <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800">
        {displayValue}
      </div>
      {helperText ? (
        <span className="mt-1 block text-xs text-zinc-500">{helperText}</span>
      ) : null}
    </div>
  );
}




