import { NextResponse } from "next/server";
import { setConfigurationFavorite } from "@/lib/queries";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  isFavorite: z.boolean(),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const configuration = await setConfigurationFavorite(configId, parsed.data.isFavorite);

  if (!configuration) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  return NextResponse.json({ isFavorite: configuration.isFavorite });
}