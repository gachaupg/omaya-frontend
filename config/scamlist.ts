/** Normalize a URL-like env value (trim, drop trailing slash). */
function normalizeUrlValue(raw: string): string {
  return String(raw).trim().replace(/\/+$/, "");
}

const SCAMLIST_API_KEY_ENV_KEYS = ["SCAMLIST_API_KEY"] as const;
const SCAMLIST_API_BASE_URL_ENV_KEYS = ["SCAMLIST_API_BASE_URL"] as const;

/**
 * Use indexed access so Next.js does not replace the value while building the
 * image. ECS can then inject any supported key when the container starts.
 */
function readEnvKeyFromProcessEnv(keys: readonly string[]): string {
  if (typeof process === "undefined") return "";

  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }

  return "";
}

/**
 * Server-only Scamlist config. This key is a secret and must never be sent to
 * the browser, so unlike the API base URL / Sanity config there is no
 * client-side (window.__RUNTIME_CONFIG__) counterpart for it.
 */
export function getScamlistApiKeyFromEnv(): string {
  return readEnvKeyFromProcessEnv(SCAMLIST_API_KEY_ENV_KEYS);
}

/** Server-only Scamlist API origin. ECS injects SCAMLIST_API_BASE_URL at container start. */
export function getScamlistApiBaseUrlFromEnv(): string {
  const raw = readEnvKeyFromProcessEnv(SCAMLIST_API_BASE_URL_ENV_KEYS);
  return raw ? normalizeUrlValue(raw) : "";
}
