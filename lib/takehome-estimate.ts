import { findCityOption } from "@/lib/takehome-cities";
import { roundMoney } from "@/lib/net-worth";

export type TakehomeFilingStatus = "single" | "married";

export type TakehomeEstimateInput = {
  grossSalary: number;
  filingStatus: TakehomeFilingStatus;
  state: string;
  cityId?: string;
};

export type TakehomeBreakdownLine = {
  label: string;
  amount: number;
};

export type TakehomeEstimateResult = {
  takeHome: number;
  breakdown: TakehomeBreakdownLine[];
  source: "payrolltax" | "fallback";
  fallbackReason?: string;
};

type PayrollTaxBracket = {
  from: number;
  to: number | null;
  rate: number;
};

type PayrollTaxLine = {
  tax_type_code: string;
  name: string;
  category?: string;
  taxpayer_side?: string;
  jurisdiction?: string;
  rate_structure: string;
  rate?: number;
  wage_base?: number | null;
  brackets?: PayrollTaxBracket[];
};

type PayrollTaxResponse = {
  taxes?: PayrollTaxLine[];
};

type ReadyTaxResponse = {
  data?: {
    attributes?: {
      federal?: { tax?: number };
      state?: { tax?: number; state?: string };
      payroll?: {
        social_security_employee?: number;
        medicare_employee?: number;
        medicare_additional?: number;
        employee_total?: number;
      };
      totals?: { take_home?: number; total_tax?: number };
    };
  };
};

const PAYROLLTAX_BASE_URL = "https://payrolltaxapi.com/v1/rates/lookup";
const READY_DEMO_URL = "https://readyapis.com/demo/api/v1/tax/calculate";
const READY_PROD_URL = "https://readyapis.com/api/v1/tax/calculate";

const FICA_2026 = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 176_100,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: {
    single: 200_000,
    married: 250_000,
  },
} as const;

const REQUEST_TIMEOUT_MS = 12_000;

function readyFilingStatus(status: TakehomeFilingStatus): string {
  return status === "married" ? "married_filing_jointly" : "single";
}

function currentTaxYearPayDate(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function isEmployeeTax(tax: PayrollTaxLine): boolean {
  if (tax.taxpayer_side === "employee") return true;
  if (tax.tax_type_code.endsWith("_EE")) return true;
  if (tax.taxpayer_side === "employer") return false;
  if (tax.tax_type_code.endsWith("_ER")) return false;
  return true;
}

function calculateGraduatedTax(
  wages: number,
  brackets: PayrollTaxBracket[] | undefined
): number {
  if (!brackets?.length) return 0;

  let tax = 0;
  for (const bracket of brackets) {
    if (wages <= bracket.from) break;
    const upper = bracket.to ?? Number.POSITIVE_INFINITY;
    const taxable = Math.min(wages, upper) - bracket.from;
    if (taxable > 0) {
      tax += taxable * bracket.rate;
    }
  }
  return tax;
}

function calculatePayrollTaxLineAmount(
  tax: PayrollTaxLine,
  grossWages: number,
  ytdWages = 0
): number {
  switch (tax.rate_structure) {
    case "graduated":
      return calculateGraduatedTax(grossWages, tax.brackets);
    case "wage_base_capped": {
      const rate = tax.rate ?? 0;
      const wageBase = tax.wage_base ?? Number.POSITIVE_INFINITY;
      const remainingBase = Math.max(0, wageBase - ytdWages);
      return rate * Math.min(grossWages, remainingBase);
    }
    case "flat_percent":
    default:
      return (tax.rate ?? 0) * grossWages;
  }
}

function groupBreakdown(lines: PayrollTaxLine[], grossWages: number): TakehomeBreakdownLine[] {
  const grouped = new Map<string, number>();

  for (const tax of lines) {
    if (!isEmployeeTax(tax)) continue;
    const amount = calculatePayrollTaxLineAmount(tax, grossWages);
    if (amount <= 0) continue;
    const key = tax.jurisdiction ? `${tax.jurisdiction} - ${tax.name}` : tax.name;
    grouped.set(key, roundMoney((grouped.get(key) ?? 0) + amount));
  }

  return Array.from(grouped.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function estimateWithPayrollTax(
  input: TakehomeEstimateInput
): Promise<TakehomeEstimateResult> {
  const apiKey = process.env.PAYROLLTAX_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing PAYROLLTAX_API_KEY");
  }

  const city = findCityOption(input.state, input.cityId);
  const params = new URLSearchParams({
    workState: input.state.toUpperCase(),
    payDate: currentTaxYearPayDate(),
    filingStatus: input.filingStatus,
    grossWages: String(input.grossSalary),
    payPeriod: "annual",
  });

  if (city) {
    params.set("workCity", city.workCity);
    params.set("workCounty", city.workCounty);
  }

  const response = await fetchWithTimeout(
    `${PAYROLLTAX_BASE_URL}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`PayrollTax ${response.status}: ${message.slice(0, 200)}`);
  }

  const payload = (await response.json()) as PayrollTaxResponse;
  const taxes = payload.taxes ?? [];
  if (taxes.length === 0) {
    throw new Error("PayrollTax returned no tax lines");
  }

  const employeeTaxes = taxes.filter(isEmployeeTax);
  const totalTaxes = roundMoney(
    employeeTaxes.reduce(
      (sum, tax) => sum + calculatePayrollTaxLineAmount(tax, input.grossSalary),
      0
    )
  );

  return {
    takeHome: roundMoney(input.grossSalary - totalTaxes),
    breakdown: groupBreakdown(employeeTaxes, input.grossSalary),
    source: "payrolltax",
  };
}

function calculateFica(grossSalary: number, filingStatus: TakehomeFilingStatus) {
  const ssTax = roundMoney(
    FICA_2026.socialSecurityRate *
      Math.min(grossSalary, FICA_2026.socialSecurityWageBase)
  );

  const medicareTax = roundMoney(FICA_2026.medicareRate * grossSalary);

  const threshold = FICA_2026.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTax = roundMoney(
    FICA_2026.additionalMedicareRate * Math.max(0, grossSalary - threshold)
  );

  return {
    ssTax,
    medicareTax,
    additionalMedicareTax,
    total: roundMoney(ssTax + medicareTax + additionalMedicareTax),
  };
}

async function estimateWithReadyFallback(
  input: TakehomeEstimateInput,
  fallbackReason: string
): Promise<TakehomeEstimateResult> {
  const readyKey = process.env.READYAPIS_API_KEY?.trim();
  const baseUrl = readyKey ? READY_PROD_URL : READY_DEMO_URL;

  const params = new URLSearchParams({
    income: String(input.grossSalary),
    filing_status: readyFilingStatus(input.filingStatus),
    year: String(new Date().getFullYear()),
    state: input.state.toUpperCase(),
  });

  const headers: HeadersInit = readyKey
    ? { Authorization: `Bearer ${readyKey}` }
    : {};

  const response = await fetchWithTimeout(`${baseUrl}?${params.toString()}`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Ready APIs ${response.status}: ${message.slice(0, 200)}`);
  }

  const payload = (await response.json()) as ReadyTaxResponse;
  const attributes = payload.data?.attributes;
  if (!attributes) {
    throw new Error("Ready APIs returned an invalid payload");
  }

  const federalTax = roundMoney(attributes.federal?.tax ?? 0);
  const stateTax = roundMoney(attributes.state?.tax ?? 0);
  const payroll = attributes.payroll;

  if (attributes.totals?.take_home != null && payroll?.employee_total != null) {
    const breakdown: TakehomeBreakdownLine[] = [
      { label: "Federal income tax", amount: federalTax },
      { label: "State income tax", amount: stateTax },
      { label: "Social Security", amount: roundMoney(payroll.social_security_employee ?? 0) },
      { label: "Medicare", amount: roundMoney(payroll.medicare_employee ?? 0) },
    ];

    const additionalMedicare = roundMoney(payroll.medicare_additional ?? 0);
    if (additionalMedicare > 0) {
      breakdown.push({
        label: "Additional Medicare",
        amount: additionalMedicare,
      });
    }

    return {
      takeHome: roundMoney(attributes.totals.take_home),
      breakdown: breakdown.filter((line) => line.amount > 0),
      source: "fallback",
      fallbackReason,
    };
  }

  const fica = calculateFica(input.grossSalary, input.filingStatus);
  const totalTaxes = roundMoney(federalTax + stateTax + fica.total);

  const breakdown: TakehomeBreakdownLine[] = [
    { label: "Federal income tax", amount: federalTax },
    { label: "State income tax", amount: stateTax },
    { label: "Social Security", amount: fica.ssTax },
    { label: "Medicare", amount: fica.medicareTax },
  ];

  if (fica.additionalMedicareTax > 0) {
    breakdown.push({
      label: "Additional Medicare",
      amount: fica.additionalMedicareTax,
    });
  }

  return {
    takeHome: roundMoney(input.grossSalary - totalTaxes),
    breakdown: breakdown.filter((line) => line.amount > 0),
    source: "fallback",
    fallbackReason,
  };
}

export async function estimateTakehome(
  input: TakehomeEstimateInput
): Promise<TakehomeEstimateResult> {
  try {
    return await estimateWithPayrollTax(input);
  } catch (primaryError) {
    const reason =
      primaryError instanceof Error
        ? primaryError.message
        : "PayrollTax request failed";

    return estimateWithReadyFallback(input, reason);
  }
}
