import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import JSZip from "jszip";
import {
  getScenarioProjectionViews,
  getScenarioRetirementAgeDetailsFromViews,
  getScenarioSummaryStats,
} from "@/lib/scenario-summary";
import { ScenarioPdfDocument, type ScenarioPdfReportData } from "@/lib/scenario-pdf-document";
import type { RetirementConfig } from "@/lib/types";

export function parseExportIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;

  const ids = raw
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0);

  const unique = Array.from(new Set(ids));
  if (unique.length === 0) {
    return null;
  }

  return unique;
}

function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "scenario";
}

function uniquePdfFilename(name: string, id: number, used: Set<string>): string {
  const base = sanitizeFilename(name) + "-" + id + ".pdf";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let counter = 2;
  while (used.has(sanitizeFilename(name) + "-" + id + "-" + counter + ".pdf")) {
    counter += 1;
  }

  const filename = sanitizeFilename(name) + "-" + id + "-" + counter + ".pdf";
  used.add(filename);
  return filename;
}

export function buildScenarioPdfReport(configuration: RetirementConfig): ScenarioPdfReportData {
  const projectionViews = getScenarioProjectionViews(configuration);

  return {
    configuration,
    summary: getScenarioSummaryStats(configuration),
    retirementAgeDetails: getScenarioRetirementAgeDetailsFromViews(
      projectionViews,
      configuration
    ),
    projectionViews,
  };
}

export async function renderScenarioPdfBuffer(
  report: ScenarioPdfReportData
): Promise<Buffer> {
  const element = createElement(ScenarioPdfDocument, { report });
  const buffer = await renderToBuffer(element as ReactElement<DocumentProps>);
  return Buffer.from(buffer);
}

export async function buildScenarioReportsZip(
  configurations: RetirementConfig[]
): Promise<Buffer> {
  const zip = new JSZip();
  const usedFilenames = new Set<string>();

  for (const configuration of configurations) {
    const report = buildScenarioPdfReport(configuration);
    const pdfBuffer = await renderScenarioPdfBuffer(report);
    const filename = uniquePdfFilename(configuration.name, configuration.id, usedFilenames);
    zip.file(filename, pdfBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return zipBuffer;
}




