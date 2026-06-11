import { NextResponse } from "next/server";
import {
  createConfiguration,
  listConfigurations,
} from "@/lib/queries";
import { configurationSaveSchema } from "@/lib/types";
import { validateConfigAges } from "@/lib/validation";

export async function GET() {
  const configurations = await listConfigurations();
  return NextResponse.json(configurations);
}

export async function POST(request: Request) {
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
  const configuration = await createConfiguration(configInput, {
    netWorthBreakdown,
    expenseBreakdown,
  });
  return NextResponse.json(configuration, { status: 201 });
}
