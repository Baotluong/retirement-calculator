import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const configurations = sqliteTable("configurations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  createdAt: text("created_at").notNull(),
  currentAgeYears: integer("current_age_years").notNull(),
  currentAgeMonths: integer("current_age_months").notNull().default(0),
  retirementAge: integer("retirement_age").notNull(),
  earliestRetirementAge: integer("earliest_retirement_age"),
  lifeExpectancy: integer("life_expectancy").notNull(),
  currentNetWorth: real("current_net_worth").notNull(),
  annualIncome: real("annual_income").notNull(),
  annualExpenses: real("annual_expenses").notNull(),
  investmentReturnRate: real("investment_return_rate").notNull(),
  inflationRate: real("inflation_rate").notNull(),
  postRetirementExpenses: real("post_retirement_expenses"),
});

export const netWorthItems = sqliteTable("net_worth_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  configurationId: integer("configuration_id").notNull(),
  name: text("name").notNull(),
  entryType: text("entry_type").notNull(),
  amount: real("amount").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const expenseBreakdownItems = sqliteTable("expense_breakdown_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  configurationId: integer("configuration_id").notNull(),
  month: integer("month").notNull(),
  amount: real("amount").notNull(),
});
