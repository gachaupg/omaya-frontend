/** Resolve API origin from VITE_BASE_URL only (no fallback). */
export function getApiBaseUrlFromEnv(): string {
  const raw = process.env.VITE_BASE_URL || "";
  return String(raw).trim().replace(/\/+$/, "");
}

export const API_BASE_URL = getApiBaseUrlFromEnv();
