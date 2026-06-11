import { estimateTakehome } from "../lib/takehome-estimate";

async function main() {
  const cases = [
    { label: "TX single", grossSalary: 120000, filingStatus: "single" as const, state: "TX" },
    { label: "CA single", grossSalary: 120000, filingStatus: "single" as const, state: "CA" },
    { label: "NY NYC", grossSalary: 120000, filingStatus: "single" as const, state: "NY", cityId: "nyc" },
    { label: "CA married", grossSalary: 120000, filingStatus: "married" as const, state: "CA" },
  ];

  delete process.env.PAYROLLTAX_API_KEY;

  for (const testCase of cases) {
    const { label, ...input } = testCase;
    const result = await estimateTakehome(input);
    console.log(
      JSON.stringify({
        label,
        source: result.source,
        takeHome: result.takeHome,
        totalTaxes: result.breakdown.reduce((sum, line) => sum + line.amount, 0),
        fallbackReason: result.fallbackReason?.slice(0, 80),
      })
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
