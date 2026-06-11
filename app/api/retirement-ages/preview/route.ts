import { NextResponse } from "next/server";
import { computeRetirementAgesPreview } from "@/lib/retirement-calc";
import { retirementConfigSchema } from "@/lib/types";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = retirementConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ages = computeRetirementAgesPreview(parsed.data);
  return NextResponse.json(ages);
}
