/** Resolve API origin from env only (no hardcoded fallback). */
export function getApiBaseUrlFromEnv(): string {
  const raw =
    process.env.VITE_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";
  return String(raw).trim().replace(/\/+$/, "");
}

export const API_BASE_URL = getApiBaseUrlFromEnv();
