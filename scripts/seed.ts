import { listConfigurations, createConfiguration } from "../lib/queries";
import { defaultExpenseBreakdown } from "../lib/expenses";
import { defaultNetWorthBreakdown } from "../lib/net-worth";

async function seed() {
  const existing = await listConfigurations();

  if (existing.length > 0) {
    console.log("Database already has scenarios. Skipping seed.");
    return;
  }

  const configuration = await createConfiguration(
    {
      name: "Baseline plan",
      description: "Conservative growth assumptions with moderate savings.",
      location: "Austin, TX",
      currentAgeYears: 35,
      currentAgeMonths: 6,
      retirementAge: 65,
      lifeExpectancy: 90,
      currentNetWorth: 150000,
      annualIncome: 120000,
      annualExpenses: 75000,
      investmentReturnRate: 0.06,
      inflationRate: 0.033,
      postRetirementExpenses: 0,
    },
    {
      netWorthBreakdown: defaultNetWorthBreakdown,
      expenseBreakdown: defaultExpenseBreakdown,
    }
  );

  console.log("Seeded scenario: " + configuration.name + " (id " + configuration.id + ")");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
