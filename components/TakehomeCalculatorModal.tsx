"use client";

import { useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import { formatMoneyDisplay } from "@/lib/money-format";
import {
  US_STATE_OPTIONS,
  formatTakehomeLocation,
  getCitiesForState,
} from "@/lib/takehome-cities";
import type { TakehomeFilingStatus } from "@/lib/takehome-estimate";

type TakehomeBreakdownLine = {
  label: string;
  amount: number;
};

type TakehomeEstimateResponse = {
  takeHome: number;
  breakdown: TakehomeBreakdownLine[];
  source: "payrolltax" | "fallback";
  fallbackReason?: string;
};

export type TakehomeApplyResult = {
  takeHome: number;
  location: string;
};

type TakehomeCalculatorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: TakehomeApplyResult) => void;
};

export function TakehomeCalculatorModal({
  isOpen,
  onClose,
  onApply,
}: TakehomeCalculatorModalProps) {
  const [grossSalary, setGrossSalary] = useState(120000);
  const [filingStatus, setFilingStatus] = useState<TakehomeFilingStatus>("single");
  const [state, setState] = useState("CA");
  const [cityId, setCityId] = useState("");
  const [estimate, setEstimate] = useState<TakehomeEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityOptions = useMemo(() => getCitiesForState(state), [state]);

  useEffect(() => {
    if (!isOpen) return;
    setEstimate(null);
    setError(null);
    setLoading(false);
  }, [isOpen]);

  useEffect(() => {
    setCityId("");
  }, [state]);

  if (!isOpen) {
    return null;
  }

  async function handleCalculate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/takehome/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grossSalary,
          filingStatus,
          state,
          cityId: cityId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Unable to estimate take-home pay";
        setEstimate(null);
        setError(message);
        return;
      }

      setEstimate(data as TakehomeEstimateResponse);
    } catch {
      setEstimate(null);
      setError("Unable to estimate take-home pay");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!estimate) return;
    onApply({
      takeHome: estimate.takeHome,
      location: formatTakehomeLocation(state, cityId || undefined),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40"
        aria-label="Close take-home calculator"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="shrink-0 border-b border-zinc-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Take-home calculator</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Estimate annual take-home from gross salary, filing status, and location.
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Gross annual salary</span>
            <MoneyInput
              value={grossSalary}
              onChange={(value) => setGrossSalary(value ?? 0)}
              min={1}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Filing status</span>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value as TakehomeFilingStatus)}
            >
              <option value="single">Single</option>
              <option value="married">Married filing jointly</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">State</span>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              {US_STATE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          {cityOptions.length > 0 ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">City (optional)</span>
              <select
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                <option value="">State-level only</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <p className="text-xs text-zinc-500">
            Estimate only â€” not tax advice. Does not include 401(k), health insurance, or other pre-tax deductions.
          </p>

          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading || grossSalary <= 0}
            className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {loading ? "Calculating..." : "Calculate take-home"}
          </button>

          {estimate?.source === "fallback" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              State-level estimate (PayrollTax unavailable). City/local taxes may be omitted.
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {estimate ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Estimated annual take-home</span>
                <span className="text-lg font-semibold text-zinc-900">
                  {formatMoneyDisplay(estimate.takeHome)}
                </span>
              </div>
              {estimate.breakdown.length > 0 ? (
                <div className="space-y-1 border-t border-zinc-200 pt-2">
                  {estimate.breakdown.map((line) => (
                    <div key={line.label} className="flex items-center justify-between text-sm text-zinc-600">
                      <span>{line.label}</span>
                      <span>{formatMoneyDisplay(line.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
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
              disabled={!estimate}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Apply to annual takehome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

