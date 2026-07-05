import { NextResponse } from "next/server";
import {
  deleteConfiguration,
  getConfiguration,
  setConfigurationFavorite,
  updateConfiguration,
} from "@/lib/queries";
import { configurationSaveSchema } from "@/lib/types";
import { z } from "zod";

const favoritePatchSchema = z.object({
  isFavorite: z.boolean(),
});
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

  const parsed = favoritePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const configuration = await setConfigurationFavorite(configId, parsed.data.isFavorite);

  if (!configuration) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  return NextResponse.json({ isFavorite: configuration.isFavorite });
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

