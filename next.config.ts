import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const { combinedEnv } = loadEnvConfig(process.cwd());

const DEFAULT_ALLOWED_DEV_ORIGINS = [
  "100.114.33.19",
  "192.168.4.30",
  "localhost",
  "127.0.0.1",
];

function parseAllowedDevOrigins(): string[] {
  const origins = new Set<string>(DEFAULT_ALLOWED_DEV_ORIGINS);
  const raw = combinedEnv.ALLOWED_DEV_ORIGINS;

  if (!raw?.trim()) {
    return Array.from(origins);
  }

  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    try {
      const url = trimmed.includes("://") ? new URL(trimmed) : new URL("http://" + trimmed);
      origins.add(url.hostname);
      origins.add(url.host);
    } catch {
      origins.add(trimmed);
    }
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@react-pdf/renderer"],
  allowedDevOrigins: parseAllowedDevOrigins(),
};

export default nextConfig;
