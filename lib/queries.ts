import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  configurations,
  expenseBreakdownItems,
  netWorthItems,
} from "./schema";
import { defaultExpenseBreakdown, normalizeExpenseBreakdown } from "./expenses";
import { computeEarliestRetirementAge, computeSafeRetirementAge } from "./retirement-calc";
import { defaultNetWorthBreakdown } from "./net-worth";
import type {
  ExpenseMonthInput,
  NetWorthItemInput,
  RetirementConfig,
  RetirementConfigInput,
} from "./types";

type ConfigurationRow = typeof configurations.$inferSelect;
type NetWorthItemRow = typeof netWorthItems.$inferSelect;
type ExpenseBreakdownItemRow = typeof expenseBreakdownItems.$inferSelect;

type ConfigurationBreakdowns = {
  netWorthBreakdown?: NetWorthItemInput[];
  expenseBreakdown?: ExpenseMonthInput[];
};

function toConfig(
  row: ConfigurationRow,
  netWorthBreakdown: NetWorthItemInput[] = [],
  expenseBreakdown: ExpenseMonthInput[] = []
): RetirementConfig {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    createdAt: row.createdAt,
    currentAgeYears: row.currentAgeYears,
    currentAgeMonths: row.currentAgeMonths,
    retirementAge: row.retirementAge,
    earliestRetirementAge: row.earliestRetirementAge ?? null,
    safeRetirementAge: row.safeRetirementAge ?? null,
    lifeExpectancy: row.lifeExpectancy,
    currentNetWorth: row.currentNetWorth,
    annualIncome: row.annualIncome,
    annualExpenses: row.annualExpenses,
    investmentReturnRate: row.investmentReturnRate,
    inflationRate: row.inflationRate,
    postRetirementExpenses: row.postRetirementExpenses ?? undefined,
    optionalExpensesStartAfterYears: row.optionalExpensesStartAfterYears ?? undefined,
    netWorthBreakdown,
    expenseBreakdown,
  };
}

function toCalculationInput(config: RetirementConfig): RetirementConfigInput {
  const {
    id: _id,
    createdAt: _createdAt,
    earliestRetirementAge: _earliestRetirementAge,
    safeRetirementAge: _safeRetirementAge,
    netWorthBreakdown: _netWorthBreakdown,
    expenseBreakdown,
    ...input
  } = config;

  return {
    ...input,
    expenseBreakdown,
  };
}

function computeDerivedRowValues(config: RetirementConfig) {
  const input = toCalculationInput(config);

  return {
    earliestRetirementAge: computeEarliestRetirementAge(input),
    safeRetirementAge: computeSafeRetirementAge(input),
  };
}

function withCalculationBreakdown(
  input: RetirementConfigInput,
  expenseBreakdown?: ExpenseMonthInput[]
): RetirementConfigInput {
  return {
    ...input,
    expenseBreakdown: expenseBreakdown ?? input.expenseBreakdown,
  };
}

function toRowValues(
  input: RetirementConfigInput,
  expenseBreakdown?: ExpenseMonthInput[]
) {
  const calculationInput = withCalculationBreakdown(input, expenseBreakdown);

  return {
    name: input.name,
    description: input.description ?? null,
    location: input.location ?? null,
    currentAgeYears: input.currentAgeYears,
    currentAgeMonths: input.currentAgeMonths,
    retirementAge: input.retirementAge,
    earliestRetirementAge: computeEarliestRetirementAge(calculationInput),
    safeRetirementAge: computeSafeRetirementAge(calculationInput),
    lifeExpectancy: input.lifeExpectancy,
    currentNetWorth: input.currentNetWorth,
    annualIncome: input.annualIncome,
    annualExpenses: input.annualExpenses,
    investmentReturnRate: input.investmentReturnRate,
    inflationRate: input.inflationRate,
    postRetirementExpenses: input.postRetirementExpenses ?? null,
    optionalExpensesStartAfterYears: input.optionalExpensesStartAfterYears ?? null,
  };
}

function toNetWorthBreakdownItems(rows: NetWorthItemRow[]): NetWorthItemInput[] {
  return rows.map((row) => ({
    name: row.name,
    entryType: row.entryType as NetWorthItemInput["entryType"],
    amount: row.amount,
  }));
}

function toExpenseBreakdownItems(
  rows: ExpenseBreakdownItemRow[]
): ExpenseMonthInput[] {
  return normalizeExpenseBreakdown(
    rows.map((row) => ({
      month: row.month,
      amount: row.amount,
    }))
  );
}

export async function getNetWorthItems(
  configurationId: number
): Promise<NetWorthItemInput[]> {
  const rows = await db
    .select()
    .from(netWorthItems)
    .where(eq(netWorthItems.configurationId, configurationId))
    .orderBy(netWorthItems.sortOrder);

  return toNetWorthBreakdownItems(rows);
}

export async function getExpenseBreakdownItems(
  configurationId: number
): Promise<ExpenseMonthInput[]> {
  const rows = await db
    .select()
    .from(expenseBreakdownItems)
    .where(eq(expenseBreakdownItems.configurationId, configurationId))
    .orderBy(expenseBreakdownItems.month);

  return toExpenseBreakdownItems(rows);
}

export async function getLatestNetWorthItems(): Promise<NetWorthItemInput[]> {
  const latestConfigs = await db
    .select()
    .from(configurations)
    .orderBy(desc(configurations.createdAt))
    .limit(1);

  const latestConfig = latestConfigs[0];
  if (!latestConfig) {
    return defaultNetWorthBreakdown;
  }

  const items = await getNetWorthItems(latestConfig.id);
  return items.length > 0 ? items : defaultNetWorthBreakdown;
}

export async function getLatestExpenseBreakdown(): Promise<ExpenseMonthInput[]> {
  const latestConfigs = await db
    .select()
    .from(configurations)
    .orderBy(desc(configurations.createdAt))
    .limit(1);

  const latestConfig = latestConfigs[0];
  if (!latestConfig) {
    return defaultExpenseBreakdown;
  }

  const items = await getExpenseBreakdownItems(latestConfig.id);
  return items.some((item) => item.amount > 0)
    ? items
    : defaultExpenseBreakdown;
}

export async function replaceNetWorthItems(
  configurationId: number,
  items: NetWorthItemInput[]
): Promise<void> {
  await db
    .delete(netWorthItems)
    .where(eq(netWorthItems.configurationId, configurationId));

  if (items.length === 0) {
    return;
  }

  await db.insert(netWorthItems).values(
    items.map((item, index) => ({
      configurationId,
      name: item.name,
      entryType: item.entryType,
      amount: item.amount,
      sortOrder: index,
    }))
  );
}

export async function replaceExpenseBreakdownItems(
  configurationId: number,
  items: ExpenseMonthInput[]
): Promise<void> {
  await db
    .delete(expenseBreakdownItems)
    .where(eq(expenseBreakdownItems.configurationId, configurationId));

  const normalized = normalizeExpenseBreakdown(items);

  await db.insert(expenseBreakdownItems).values(
    normalized.map((item) => ({
      configurationId,
      month: item.month,
      amount: item.amount,
    }))
  );
}

export async function listConfigurations(): Promise<RetirementConfig[]> {
  const rows = await db
    .select()
    .from(configurations)
    .orderBy(desc(configurations.createdAt));

  return Promise.all(
    rows.map(async (row) =>
      toConfig(
        row,
        await getNetWorthItems(row.id),
        await getExpenseBreakdownItems(row.id)
      )
    )
  );
}

export async function getConfiguration(id: number): Promise<RetirementConfig | null> {
  const rows = await db
    .select()
    .from(configurations)
    .where(eq(configurations.id, id))
    .limit(1);

  if (!rows[0]) {
    return null;
  }

  return toConfig(
    rows[0],
    await getNetWorthItems(id),
    await getExpenseBreakdownItems(id)
  );
}

export async function createConfiguration(
  input: RetirementConfigInput,
  breakdowns: ConfigurationBreakdowns = {}
): Promise<RetirementConfig> {
  const netWorthBreakdown = breakdowns.netWorthBreakdown ?? [];
  const expenseBreakdown = breakdowns.expenseBreakdown ?? [];

  const rows = await db
    .insert(configurations)
    .values({
      ...toRowValues(input, expenseBreakdown),
      createdAt: new Date().toISOString(),
    })
    .returning();

  const configuration = rows[0];
  await replaceNetWorthItems(configuration.id, netWorthBreakdown);
  await replaceExpenseBreakdownItems(configuration.id, expenseBreakdown);

  return toConfig(configuration, netWorthBreakdown, expenseBreakdown);
}

export async function updateConfiguration(
  id: number,
  input: RetirementConfigInput,
  breakdowns: ConfigurationBreakdowns = {}
): Promise<RetirementConfig | null> {
  const rows = await db
    .update(configurations)
    .set(toRowValues(input, breakdowns.expenseBreakdown))
    .where(eq(configurations.id, id))
    .returning();

  if (!rows[0]) {
    return null;
  }

  if (breakdowns.netWorthBreakdown !== undefined) {
    await replaceNetWorthItems(id, breakdowns.netWorthBreakdown);
  }

  if (breakdowns.expenseBreakdown !== undefined) {
    await replaceExpenseBreakdownItems(id, breakdowns.expenseBreakdown);
  }

  const savedNetWorth =
    breakdowns.netWorthBreakdown !== undefined
      ? breakdowns.netWorthBreakdown
      : await getNetWorthItems(id);
  const savedExpense =
    breakdowns.expenseBreakdown !== undefined
      ? normalizeExpenseBreakdown(breakdowns.expenseBreakdown)
      : await getExpenseBreakdownItems(id);

  return toConfig(rows[0], savedNetWorth, savedExpense);
}

export async function deleteConfiguration(id: number): Promise<boolean> {
  await db.delete(netWorthItems).where(eq(netWorthItems.configurationId, id));
  await db
    .delete(expenseBreakdownItems)
    .where(eq(expenseBreakdownItems.configurationId, id));

  const rows = await db
    .delete(configurations)
    .where(eq(configurations.id, id))
    .returning({ id: configurations.id });

  return rows.length > 0;
}
export type RecomputeDerivedFieldsScenarioResult = {
  id: number;
  name: string;
  changed: boolean;
  earliestRetirementAge: number | null;
  safeRetirementAge: number | null;
  previousEarliestRetirementAge: number | null;
  previousSafeRetirementAge: number | null;
};

export type RecomputeDerivedFieldsResult = {
  total: number;
  updated: number;
  unchanged: number;
  scenarios: RecomputeDerivedFieldsScenarioResult[];
};

export async function recomputeAllDerivedConfigurationFields(): Promise<RecomputeDerivedFieldsResult> {
  const configs = await listConfigurations();
  const scenarios: RecomputeDerivedFieldsScenarioResult[] = [];
  let updated = 0;

  for (const config of configs) {
    const derived = computeDerivedRowValues(config);
    const changed =
      derived.earliestRetirementAge !== config.earliestRetirementAge ||
      derived.safeRetirementAge !== config.safeRetirementAge;

    scenarios.push({
      id: config.id,
      name: config.name,
      changed,
      earliestRetirementAge: derived.earliestRetirementAge,
      safeRetirementAge: derived.safeRetirementAge,
      previousEarliestRetirementAge: config.earliestRetirementAge,
      previousSafeRetirementAge: config.safeRetirementAge,
    });

    if (!changed) {
      continue;
    }

    await db
      .update(configurations)
      .set(derived)
      .where(eq(configurations.id, config.id));

    updated += 1;
  }

  return {
    total: configs.length,
    updated,
    unchanged: configs.length - updated,
    scenarios,
  };
}