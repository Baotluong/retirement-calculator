import { NextResponse } from "next/server";
import { z } from "zod";
import { estimateTakehome } from "@/lib/takehome-estimate";
import { US_STATE_OPTIONS } from "@/lib/takehome-cities";

const validStates = new Set(US_STATE_OPTIONS.map((state) => state.code));

const takehomeEstimateSchema = z.object({
  grossSalary: z.coerce.number().positive("Gross salary must be greater than zero"),
  filingStatus: z.enum(["single", "married"]),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => validStates.has(value), "Invalid state code"),
  cityId: z.string().trim().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = takehomeEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await estimateTakehome(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to estimate take-home pay";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
