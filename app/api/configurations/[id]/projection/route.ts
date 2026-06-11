import { NextResponse } from "next/server";
import { getConfiguration } from "@/lib/queries";
import { projectNetWorth } from "@/lib/projection";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const configId = Number(id);

  if (!Number.isInteger(configId) || configId <= 0) {
    return NextResponse.json({ error: "Invalid configuration id" }, { status: 400 });
  }

  const configuration = await getConfiguration(configId);

  if (!configuration) {
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  }

  const projection = projectNetWorth(configuration);
  return NextResponse.json(projection);
}
