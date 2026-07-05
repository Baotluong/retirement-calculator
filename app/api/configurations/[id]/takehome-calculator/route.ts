import { NextResponse } from "next/server";
import { setConfigurationTakehomeCalculator } from "@/lib/queries";
import { takehomeCalculatorSchema } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const configId = parseId(id);

  if (!configId) {
    return NextResponse.json({ error: "Invalid configuration id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = takehomeCalculatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const configuration = await setConfigurationTakehomeCalculator(configId, {
    grossSalary: parsed.data.grossSalary,
    filingStatus: parsed.data.filingStatus,
    state: parsed.data.state.toUpperCase(),
    cityId: parsed.data.cityId ?? "",
    estimate: parsed.data.estimate ?? null,
  });

  if (!configuration) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  return NextResponse.json({
    takehomeCalculator: configuration.takehomeCalculator,
  });
}