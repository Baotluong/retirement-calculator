import { z } from "zod";
import type { TakehomeCalculatorState } from "@/lib/takehome-calculator";

export const netWorthEntryTypeSchema = z.enum(["credit", "debit"]);

export const netWorthItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  entryType: netWorthEntryTypeSchema,
  amount: z.coerce.number().min(0),
});

export const expenseMonthSchema = z.object({
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(14)
    .refine(
      (value) => value <= 12 || value === 13 || value === 14,
      "Invalid expense month"
    ),
  amount: z.coerce.number().min(0),
});


export const takehomeEstimateResultSchema = z.object({
  takeHome: z.number(),
  breakdown: z.array(
    z.object({
      label: z.string(),
      amount: z.number(),
    })
  ),
  source: z.enum(["payrolltax", "fallback"]),
  fallbackReason: z.string().optional(),
});

export const takehomeCalculatorSchema = z.object({
  grossSalary: z.coerce.number().positive(),
  filingStatus: z.enum(["single", "married"]),
  state: z.string().trim().min(2),
  cityId: z.string().optional(),
  estimate: takehomeEstimateResultSchema.nullable().optional(),
});

export const retirementConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  currentAgeYears: z.coerce.number().int().min(18).max(100),
  currentAgeMonths: z.coerce.number().int().min(0).max(11),
  retirementAge: z.coerce.number().int().min(18).max(100),
  lifeExpectancy: z.coerce.number().int().min(50).max(120),
  currentNetWorth: z.coerce.number().min(0),
  annualIncome: z.coerce
    .number()
    .min(0)
    .refine(
      (value) => Math.abs(value - Math.round(value * 100) / 100) < 1e-8,
      "Annual takehome must have at most 2 decimal places"
    ),
  annualExpenses: z.coerce.number().min(0),
  investmentReturnRate: z.coerce
    .number()
    .min(0)
    .max(1)
    .refine(
      (value) => Math.abs(value - Math.round(value * 1000) / 1000) < 1e-8,
      "Investment return rate must have at most 3 decimal places"
    ),
  inflationRate: z.coerce
    .number()
    .min(0)
    .max(1)
    .refine(
      (value) => Math.abs(value - Math.round(value * 1000) / 1000) < 1e-8,
      "Inflation rate must have at most 3 decimal places"
    ),
  postRetirementExpenses: z.coerce.number().optional(),
  optionalExpensesStartAfterYears: z.coerce.number().int().min(0).optional(),
  incomeDelayMonths: z.coerce.number().int().min(0).max(600).optional(),
  incomeIncreaseAfterYears: z.coerce.number().int().min(0).max(80).optional(),
  incomeIncreaseGross: z.coerce.number().min(0).optional(),
  expenseBreakdown: z.array(expenseMonthSchema).optional(),
});

export const configurationSaveSchema = retirementConfigSchema.extend({
  netWorthBreakdown: z.array(netWorthItemSchema).optional(),
  takehomeCalculator: takehomeCalculatorSchema.nullable().optional(),
});

export type NetWorthEntryType = z.infer<typeof netWorthEntryTypeSchema>;
export type NetWorthItemInput = z.infer<typeof netWorthItemSchema>;
export type ExpenseMonthInput = z.infer<typeof expenseMonthSchema>;
export type RetirementConfigInput = z.infer<typeof retirementConfigSchema>;
export type ConfigurationSaveInput = z.infer<typeof configurationSaveSchema>;

export type RetirementConfig = RetirementConfigInput & {
  id: number;
  createdAt: string;
  earliestRetirementAge: number | null;
  safeRetirementAge: number | null;
  coastFireAge: number | null;
  isFavorite: boolean;
  takehomeCalculator: TakehomeCalculatorState | null;
  netWorthBreakdown?: NetWorthItemInput[];
  expenseBreakdown?: ExpenseMonthInput[];
};

export type ProjectionYear = {
  age: number;
  year: number;
  netWorth: number;
  income: number;
  expenses: number;
  contributions: number;
  growth: number;
  isPartialYear: boolean;
  partialMonths: number;
};

export type NetWorthRow = NetWorthItemInput & {
  clientId: string;
};




