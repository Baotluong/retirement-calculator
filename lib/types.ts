import { z } from "zod";

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
  investmentReturnRate: z.coerce.number().min(0).max(1),
  inflationRate: z.coerce
    .number()
    .min(0)
    .max(1)
    .refine(
      (value) => Math.abs(value - Math.round(value * 1000) / 1000) < 1e-8,
      "Inflation rate must have at most 3 decimal places"
    ),
  postRetirementExpenses: z.coerce.number().optional(),
});

export const configurationSaveSchema = retirementConfigSchema.extend({
  netWorthBreakdown: z.array(netWorthItemSchema).optional(),
  expenseBreakdown: z.array(expenseMonthSchema).optional(),
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
