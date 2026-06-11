import { recomputeAllDerivedConfigurationFields } from "../lib/queries";

const verbose = process.argv.includes("--verbose");

function formatAge(value: number | null): string {
  return value === null ? "-" : String(value);
}

async function recomputeDerived() {
  const result = await recomputeAllDerivedConfigurationFields();

  if (verbose) {
    for (const scenario of result.scenarios) {
      if (scenario.changed) {
        console.log(
          `#${scenario.id} ${scenario.name}: updated (earliest ${formatAge(scenario.previousEarliestRetirementAge)} -> ${formatAge(scenario.earliestRetirementAge)}, safe ${formatAge(scenario.previousSafeRetirementAge)} -> ${formatAge(scenario.safeRetirementAge)})`
        );
        continue;
      }

      console.log(
        `#${scenario.id} ${scenario.name}: unchanged (earliest ${formatAge(scenario.earliestRetirementAge)}, safe ${formatAge(scenario.safeRetirementAge)})`
      );
    }
    console.log("");
  }

  console.log(
    `Recomputed derived fields for ${result.total} scenario(s): ${result.updated} updated, ${result.unchanged} unchanged.`
  );

  if (result.updated === 0) {
    console.log(
      "Stored values already match the current formulas. Run this after changing calculation logic (for example, the safe retirement multiplier)."
    );
  }
}

recomputeDerived().catch((error) => {
  console.error(error);
  process.exit(1);
});