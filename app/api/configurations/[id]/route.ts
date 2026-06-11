import { NextResponse } from "next/server";
import {
  deleteConfiguration,
  getConfiguration,
  updateConfiguration,
} from "@/lib/queries";
import { configurationSaveSchema } from "@/lib/types";
import { validateConfigAges } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const configId = parseId(id);

  if (!configId) {
    return NextResponse.json({ error: "Invalid configuration id" }, { status: 400 });
  }

  const configuration = await getConfiguration(configId);

  if (!configuration) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  return NextResponse.json(configuration);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const configId = parseId(id);

  if (!configId) {
    return NextResponse.json({ error: "Invalid configuration id" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = configurationSaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ageError = validateConfigAges(parsed.data);
  if (ageError) {
    return NextResponse.json({ error: ageError }, { status: 400 });
  }

  const {
    netWorthBreakdown = [],
    expenseBreakdown = [],
    ...configInput
  } = parsed.data;
  const configuration = await updateConfiguration(configId, configInput, {
    netWorthBreakdown,
    expenseBreakdown,
  });

  if (!configuration) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  return NextResponse.json(configuration);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const configId = parseId(id);

  if (!configId) {
    return NextResponse.json({ error: "Invalid configuration id" }, { status: 400 });
  }

  const deleted = await deleteConfiguration(configId);

  if (!deleted) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

