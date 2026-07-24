/** Normalize API origin (no trailing slash). */
function normalizeApiOrigin(raw: string): string {
  return String(raw).trim().replace(/\/+$/, "");
}

/**
 * Resolve API origin — Admin pattern: NEXT_PUBLIC_BASE_URL first.
 * Legacy keys kept so existing .env / S3 files still work.
 */
export function getApiBaseUrlFromEnv(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VITE_BASE_URL ||
    "";
  return normalizeApiOrigin(raw);
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_BASE_URL?: string;
      VITE_BASE_URL?: string;
    };
  }
}

/** Runtime fallback when build-time env was empty (Docker SSR / layout script). */
export function resolveApiBaseUrl(): string {
  const fromEnv = getApiBaseUrlFromEnv();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const cfg = window.__RUNTIME_CONFIG__;
    const raw = cfg?.NEXT_PUBLIC_BASE_URL || cfg?.VITE_BASE_URL || "";
    const fromRuntime = normalizeApiOrigin(raw);
    if (fromRuntime) return fromRuntime;
  }

  return "";
}

/** Inlined at build via NEXT_PUBLIC_BASE_URL (same as Admin apiClient). */
export const API_BASE_URL = getApiBaseUrlFromEnv();
