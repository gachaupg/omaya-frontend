/** Normalize API origin (no trailing slash). */
function normalizeApiOrigin(raw: string): string {
  return String(raw).trim().replace(/\/+$/, "");
}

const API_BASE_URL_ENV_KEYS = [
  "API_BASE_URL",
  "RUNTIME_API_BASE_URL",
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_API_URL",
  "VITE_BASE_URL",
] as const;

/**
 * Use indexed access so Next.js does not replace the value while building the
 * image. ECS can then inject any supported key when the container starts.
 */
function readApiBaseUrlFromProcessEnv(): string {
  if (typeof process === "undefined") return "";

  for (const key of API_BASE_URL_ENV_KEYS) {
    const value = process.env[key];
    if (value?.trim()) return normalizeApiOrigin(value);
  }

  return "";
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_BASE_URL?: string;
      VITE_BASE_URL?: string;
    };
  }
}

/**
 * Server-only API origin.
 * ECS injects NEXT_PUBLIC_BASE_URL at container start (AWS Secrets Manager).
 */
export function getApiBaseUrlFromEnv(): string {
  return readApiBaseUrlFromProcessEnv();
}

/** Client-only: value injected by layout via window.__RUNTIME_CONFIG__. */
function readRuntimeConfigBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const cfg = window.__RUNTIME_CONFIG__;
  const raw = cfg?.NEXT_PUBLIC_BASE_URL || cfg?.VITE_BASE_URL || "";
  return normalizeApiOrigin(raw);
}

/**
 * Resolve API origin for the current runtime.
 * - Server (Node): an API URL environment variable injected by ECS
 * - Browser: window.__RUNTIME_CONFIG__.NEXT_PUBLIC_BASE_URL (injected in layout)
 */
export function resolveApiBaseUrl(): string {
  // Server-side
  if (typeof window === "undefined") {
    return readApiBaseUrlFromProcessEnv();
  }

  // Client-side — do not use process.env; it is build-time only
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

/** Lazy API origin — server reads ECS env; client reads window.__RUNTIME_CONFIG__. */
export const API_BASE_URL = apiBaseUrlProxy;
