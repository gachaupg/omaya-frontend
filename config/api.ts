/** Resolve API origin — VITE_BASE_URL preferred, NEXT_PUBLIC_API_URL fallback. */
export function getApiBaseUrlFromEnv(): string {
  const raw =
    process.env.VITE_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return String(raw).trim().replace(/\/+$/, "");
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      VITE_BASE_URL?: string;
    };
  }
}

/** Server env first, then window.__RUNTIME_CONFIG__ injected by layout (Docker runtime). */
export function resolveApiBaseUrl(): string {
  const fromEnv = getApiBaseUrlFromEnv();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const fromRuntime = window.__RUNTIME_CONFIG__?.VITE_BASE_URL;
    if (fromRuntime) {
      return String(fromRuntime).trim().replace(/\/+$/, "");
    }
  }

  return "";
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

/** Lazy API origin — safe for Docker runtime env (not only build-time). */
export const API_BASE_URL = apiBaseUrlProxy;
