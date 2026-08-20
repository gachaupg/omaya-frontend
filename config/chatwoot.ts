function normalizeEnvValue(raw: string): string {
  return String(raw).trim();
}

/** Fallback when ECS / Secrets Manager env is missing — remove once secrets are wired. */
export const DEFAULT_CHATWOOT_BASE_URL = "https://connect.omaya.io";
export const DEFAULT_CHATWOOT_WEBSITE_TOKEN = "fH4XtymvHEZ4Pie5YcDaQjcy";

/** Prefer plain keys so ECS / Secrets Manager can inject at container start. */
const CHATWOOT_BASE_URL_ENV_KEYS = [
  "CHATWOOT_BASE_URL",
  "NEXT_PUBLIC_CHATWOOT_BASE_URL",
] as const;

const CHATWOOT_WEBSITE_TOKEN_ENV_KEYS = [
  "CHATWOOT_WEBSITE_TOKEN",
  "NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN",
] as const;

function readEnvKeyFromProcessEnv(keys: readonly string[]): string {
  if (typeof process === "undefined") return "";

  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return normalizeEnvValue(value);
  }

  return "";
}

export interface ChatwootRuntimeConfig {
  baseUrl: string;
  websiteToken: string;
}

/**
 * Server-only Chatwoot config.
 * Local: `.env` (`CHATWOOT_*` or `NEXT_PUBLIC_CHATWOOT_*`).
 * Live: AWS Secrets Manager → ECS env at container start.
 */
export function getChatwootConfigFromEnv(): ChatwootRuntimeConfig {
  const baseUrl = (
    readEnvKeyFromProcessEnv(CHATWOOT_BASE_URL_ENV_KEYS) ||
    DEFAULT_CHATWOOT_BASE_URL
  ).replace(/\/+$/, "");

  const websiteToken =
    readEnvKeyFromProcessEnv(CHATWOOT_WEBSITE_TOKEN_ENV_KEYS) ||
    DEFAULT_CHATWOOT_WEBSITE_TOKEN;

  return {
    baseUrl,
    websiteToken,
  };
}

/** Browser: values from `window.__RUNTIME_CONFIG__` (injected in root layout). */
function readRuntimeConfigChatwoot(): ChatwootRuntimeConfig {
  if (typeof window === "undefined") {
    return { baseUrl: "", websiteToken: "" };
  }

  const cfg = (
    window as unknown as { __RUNTIME_CONFIG__?: Record<string, string> }
  ).__RUNTIME_CONFIG__;

  return {
    baseUrl: (
      String(cfg?.NEXT_PUBLIC_CHATWOOT_BASE_URL ?? "").trim() ||
      DEFAULT_CHATWOOT_BASE_URL
    ).replace(/\/+$/, ""),
    websiteToken: (
      String(cfg?.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN ?? "").trim() ||
      DEFAULT_CHATWOOT_WEBSITE_TOKEN
    ),
  };
}

export function resolveChatwootConfig(): ChatwootRuntimeConfig {
  if (typeof window === "undefined") {
    return getChatwootConfigFromEnv();
  }

  const fromRuntime = readRuntimeConfigChatwoot();
  if (fromRuntime.baseUrl && fromRuntime.websiteToken) {
    return fromRuntime;
  }

  return getChatwootConfigFromEnv();
}

export function isChatwootConfigured(config: ChatwootRuntimeConfig): boolean {
  return Boolean(config.baseUrl && config.websiteToken);
}
