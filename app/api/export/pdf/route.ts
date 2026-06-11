import { NextResponse } from "next/server";
import { buildScenarioReportsZip, parseExportIds } from "@/lib/scenario-pdf-export";
import { getConfiguration } from "@/lib/queries";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids =
    body && typeof body === "object" && "ids" in body
      ? parseExportIds((body as { ids: unknown }).ids)
      : null;

  if (!ids) {
    return NextResponse.json({ error: "At least one valid scenario id is required" }, { status: 400 });
  }

  const configurations = await Promise.all(ids.map((id) => getConfiguration(id)));
  if (configurations.some((config) => !config)) {
    return NextResponse.json({ error: "One or more scenarios were not found" }, { status: 404 });
  }

  try {
    const zipBuffer = await buildScenarioReportsZip(
      configurations.map((configuration) => configuration!)
    );

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="scenario-reports.zip"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate scenario reports" }, { status: 500 });
  }
}
