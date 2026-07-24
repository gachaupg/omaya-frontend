/** Normalize API origin (no trailing slash). */
function normalizeApiOrigin(raw: string): string {
  return String(raw).trim().replace(/\/+$/, "");
}

/**
 * Resolve API origin — same pattern as Admin (`NEXT_PUBLIC_BASE_URL` first).
 * Legacy keys kept for backward compatibility.
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

function readRuntimeConfigBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const cfg = window.__RUNTIME_CONFIG__;
  const raw =
    cfg?.NEXT_PUBLIC_BASE_URL || cfg?.VITE_BASE_URL || "";
  return normalizeApiOrigin(raw);
}

/** Build-time env first, then window.__RUNTIME_CONFIG__ from layout (Docker runtime). */
export function resolveApiBaseUrl(): string {
  const fromEnv = getApiBaseUrlFromEnv();
  if (fromEnv) return fromEnv;
  return readRuntimeConfigBaseUrl();
}

const apiBaseUrlProxy = new Proxy(Object.create(null) as object, {
  get(_target, prop) {
    const url = resolveApiBaseUrl();
    if (prop === Symbol.toPrimitive) {
      return (hint: string) => (hint === "number" ? Number.NaN : url);
    }
    if (prop === "toString") return () => url;
    if (prop === "valueOf") return () => url;
    if (typeof prop === "string" && prop in String.prototype) {
      const method = (String.prototype as unknown as Record<string, unknown>)[
        prop
      ];
      if (typeof method === "function") {
        return (...args: unknown[]) =>
          (method as (...a: unknown[]) => unknown).apply(url, args);
      }
    }
    return (url as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as unknown as string;

/** Lazy API origin — baked at build via NEXT_PUBLIC_BASE_URL (Admin pattern). */
export const API_BASE_URL = apiBaseUrlProxy;
