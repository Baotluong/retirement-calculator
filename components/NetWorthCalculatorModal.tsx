"use client";

import { useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import { formatMoneyDisplay } from "@/lib/money-format";
import { calculateNetWorthSum, roundMoney } from "@/lib/net-worth";
import type { NetWorthRow } from "@/lib/types";

type NetWorthCalculatorModalProps = {
  isOpen: boolean;
  rows: NetWorthRow[];
  onClose: () => void;
  onApply: (rows: NetWorthRow[], total: number) => void;
};

function createEmptyRow(): NetWorthRow {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    entryType: "credit",
    amount: 0,
  };
}


export function NetWorthCalculatorModal({
  isOpen,
  rows,
  onClose,
  onApply,
}: NetWorthCalculatorModalProps) {
  const [draftRows, setDraftRows] = useState<NetWorthRow[]>(rows);

  useEffect(() => {
    if (isOpen) {
      setDraftRows(rows.length > 0 ? rows : [createEmptyRow()]);
    }
  }, [isOpen, rows]);

  const total = useMemo(
    () => roundMoney(calculateNetWorthSum(draftRows)),
    [draftRows]
  );

  if (!isOpen) {
    return null;
  }

  function updateRow(
    clientId: string,
    patch: Partial<Pick<NetWorthRow, "name" | "entryType" | "amount">>
  ) {
    setDraftRows((current) =>
      current.map((row) => (row.clientId === clientId ? { ...row, ...patch } : row))
    );
  }

  function addRow() {
    setDraftRows((current) => [...current, createEmptyRow()]);
  }

  function removeRow(clientId: string) {
    setDraftRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.clientId !== clientId)
    );
  }

  function handleApply() {
    const cleanedRows = draftRows.filter(
      (row) => row.name.trim().length > 0 || row.amount > 0
    );

    onApply(cleanedRows.length > 0 ? cleanedRows : [createEmptyRow()], total);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40"
        aria-label="Close net worth calculator"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="shrink-0 border-b border-zinc-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Net worth calculator</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Add credits and debits to calculate your current net worth.
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
            <div className="grid grid-cols-[1fr_120px_140px_40px] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <span>Name</span>
              <span>Type</span>
              <span>Amount</span>
              <span />
            </div>

            {draftRows.map((row) => (
              <div
                key={row.clientId}
                className="grid grid-cols-[1fr_120px_140px_40px] gap-3 items-center"
              >
                <input
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  placeholder="e.g. 401(k)"
                  value={row.name}
                  onChange={(e) => updateRow(row.clientId, { name: e.target.value })}
                />
                <select
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  value={row.entryType}
                  onChange={(e) =>
                    updateRow(row.clientId, {
                      entryType: e.target.value as NetWorthRow["entryType"],
                    })
                  }
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <MoneyInput
                  value={row.amount}
                  onChange={(value) =>
                    updateRow(row.clientId, { amount: value ?? 0 })
                  }
                  min={0}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.clientId)}
                  className="rounded-lg px-2 py-2 text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={"Remove " + row.name}
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
          >
            Add row
          </button>
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4">
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
            <span className="text-sm font-medium text-zinc-700">Total net worth</span>
            <span className="text-lg font-semibold text-zinc-900">{formatMoneyDisplay(total)}</span>
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
              Apply to current net worth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

