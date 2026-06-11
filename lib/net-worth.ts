import type { NetWorthItemInput } from "./types";

export function calculateNetWorthSum(items: NetWorthItemInput[]): number {
  return items.reduce((sum, item) => {
    const signedAmount = item.entryType === "credit" ? item.amount : -item.amount;
    return sum + signedAmount;
  }, 0);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export const defaultNetWorthBreakdown: NetWorthItemInput[] = [
  { name: "Checking & savings", entryType: "credit", amount: 25000 },
  { name: "Investment accounts", entryType: "credit", amount: 120000 },
  { name: "Home equity", entryType: "credit", amount: 80000 },
  { name: "Mortgage", entryType: "debit", amount: 75000 },
];
