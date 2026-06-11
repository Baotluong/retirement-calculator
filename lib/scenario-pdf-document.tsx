import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatCurrentAge } from "@/lib/age";
import { formatScenarioCurrency, type ScenarioSummaryStats } from "@/lib/scenario-summary";
import type { ProjectionYear, RetirementConfig } from "@/lib/types";

export type ScenarioPdfReportData = {
  configuration: RetirementConfig;
  summary: ScenarioSummaryStats;
  projection: ProjectionYear[];
};

const ROWS_PER_PAGE = 26;

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  label: {
    fontSize: 9,
    color: "#047857",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#52525b",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#71717a",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  assumptionRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 5,
  },
  assumptionLabel: {
    width: "42%",
    color: "#71717a",
  },
  assumptionValue: {
    width: "58%",
    fontFamily: "Helvetica-Bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8,
  },
  colAge: { width: "10%" },
  colYear: { width: "10%" },
  colMoney: { width: "16%" },
});

function formatPercent(value: number, decimals = 2): string {
  return (value * 100).toFixed(decimals) + "%";
}

function formatCurrency(value: number): string {
  return formatScenarioCurrency(value);
}

function chunkProjection(rows: ProjectionYear[]): ProjectionYear[][] {
  const chunks: ProjectionYear[][] = [];
  for (let index = 0; index < rows.length; index += ROWS_PER_PAGE) {
    chunks.push(rows.slice(index, index + ROWS_PER_PAGE));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.assumptionRow}>
      <Text style={styles.assumptionLabel}>{label}</Text>
      <Text style={styles.assumptionValue}>{value}</Text>
    </View>
  );
}

function ProjectionTableHeader() {
  return (
    <View style={styles.tableHeader}>
      <Text style={styles.colAge}>Age</Text>
      <Text style={styles.colYear}>Year</Text>
      <Text style={styles.colMoney}>Net worth</Text>
      <Text style={styles.colMoney}>Income</Text>
      <Text style={styles.colMoney}>Expenses</Text>
      <Text style={styles.colMoney}>Contributions</Text>
      <Text style={styles.colMoney}>Growth</Text>
    </View>
  );
}

function ProjectionTableRows({ rows }: { rows: ProjectionYear[] }) {
  return (
    <>
      {rows.map((row) => (
        <View key={row.age + "-" + row.year} style={styles.tableRow}>
          <Text style={styles.colAge}>
            {row.age}
            {row.isPartialYear ? " (" + row.partialMonths + "mo)" : ""}
          </Text>
          <Text style={styles.colYear}>{row.year}</Text>
          <Text style={styles.colMoney}>{formatCurrency(row.netWorth)}</Text>
          <Text style={styles.colMoney}>{formatCurrency(row.income)}</Text>
          <Text style={styles.colMoney}>{formatCurrency(row.expenses)}</Text>
          <Text style={styles.colMoney}>{formatCurrency(row.contributions)}</Text>
          <Text style={styles.colMoney}>{formatCurrency(row.growth)}</Text>
        </View>
      ))}
    </>
  );
}

export function ScenarioPdfDocument({ report }: { report: ScenarioPdfReportData }) {
  const { configuration, summary, projection } = report;
  const projectionChunks = chunkProjection(projection);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.label}>Retirement scenario report</Text>
        <Text style={styles.title}>{configuration.name}</Text>
        <Text style={styles.subtitle}>
          Projected from age{" "}
          {formatCurrentAge(configuration.currentAgeYears, configuration.currentAgeMonths)} to{" "}
          {configuration.lifeExpectancy}. Retire at {configuration.retirementAge}.
        </Text>
        {configuration.location ? (
          <Text style={styles.subtitle}>{configuration.location}</Text>
        ) : null}
        {configuration.description ? (
          <Text style={styles.subtitle}>{configuration.description}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Earliest retirement age</Text>
            <Text style={styles.summaryValue}>
              {summary.earliestRetirementAge === null ? "-" : String(summary.earliestRetirementAge)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net worth at retirement</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.netWorthAtRetirement)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net worth at life expectancy</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.netWorthAtLifeExpectancy)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Annual takehome</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.annualTakehome)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Annual contributions</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.annualContributions)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Assumptions</Text>
        <AssumptionRow label="Scenario name" value={configuration.name} />
        {configuration.description ? (
          <AssumptionRow label="Description" value={configuration.description} />
        ) : null}
        {configuration.location ? (
          <AssumptionRow label="Location" value={configuration.location} />
        ) : null}
        <AssumptionRow
          label="Current age"
          value={formatCurrentAge(configuration.currentAgeYears, configuration.currentAgeMonths)}
        />
        <AssumptionRow label="Life expectancy" value={String(configuration.lifeExpectancy)} />
        <AssumptionRow label="Retirement age" value={String(configuration.retirementAge)} />
        <AssumptionRow
          label="Earliest retirement age"
          value={
            configuration.earliestRetirementAge === null
              ? "-"
              : String(configuration.earliestRetirementAge)
          }
        />
        <AssumptionRow
          label="Current net worth"
          value={formatCurrency(configuration.currentNetWorth)}
        />
        <AssumptionRow label="Annual takehome" value={formatCurrency(configuration.annualIncome)} />
        <AssumptionRow
          label="Annual expenses"
          value={formatCurrency(configuration.annualExpenses)}
        />
        <AssumptionRow
          label="Post-retirement expenses (additional)"
          value={formatCurrency(configuration.postRetirementExpenses ?? 0)}
        />
        <AssumptionRow
          label="Investment return"
          value={formatPercent(configuration.investmentReturnRate)}
        />
        <AssumptionRow
          label="Inflation rate"
          value={formatPercent(configuration.inflationRate, 3)}
        />
      </Page>

      {projectionChunks.map((rows, index) => (
        <Page key={index} size="LETTER" style={styles.page}>
          <Text style={styles.sectionTitle}>
            Year-by-year breakdown{index > 0 ? " (continued)" : ""}
          </Text>
          <ProjectionTableHeader />
          <ProjectionTableRows rows={rows} />
        </Page>
      ))}
    </Document>
  );
}
