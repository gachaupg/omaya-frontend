/** Normalize a plain env string value (trim only, no URL-specific rules). */
function normalizeEnvValue(raw: string): string {
  return String(raw).trim();
}

// Prefer the plain (non `NEXT_PUBLIC_`) key so ECS/Secrets Manager can inject
// it at container start without it ever being baked into the client bundle.
const SANITY_PROJECT_ID_ENV_KEYS = [
  "SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
] as const;

const SANITY_DATASET_ENV_KEYS = [
  "SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_DATASET",
] as const;

const SANITY_API_VERSION_ENV_KEYS = [
  "SANITY_API_VERSION",
  "NEXT_PUBLIC_SANITY_API_VERSION",
] as const;

const SANITY_TOKEN_ENV_KEYS = [
  "SANITY_TOKEN",
  "NEXT_PUBLIC_SANITY_READ_TOKEN",
] as const;

/**
 * Same Sanity project/dataset as OmayaExchangeMobile (`lib/services/sanity_service.dart`).
 * Mobile queries `development` directly; web must use the same dataset via ECS env
 * (SANITY_DATASET / NEXT_PUBLIC_SANITY_DATASET) or content will not match the app.
 */
export const DEFAULT_SANITY_PROJECT_ID = "jhuegccg";
export const DEFAULT_SANITY_DATASET = "development";
export const DEFAULT_SANITY_API_VERSION = "2025-07-04";
/** Public read token — same as mobile; override via SANITY_TOKEN / NEXT_PUBLIC_SANITY_READ_TOKEN. */
export const DEFAULT_SANITY_READ_TOKEN =
  "skZ87SpjtmlUxXRc7hNu09clf4tjUJ2dpyQohaTiWsYdlKCzH2czbxZNqq0zRTXEQm0qKElIdC8L9SapC0RCHXhq4qniC5O8GkfdjoCVvtgPzYF50A26N0ra3wkTA1GBZWzCHcRmNiJQnJNbHhaZvP9zgYvwfFQa8eDiD5rXIg6605wAFjaE";

/**
 * Use indexed access so Next.js does not replace the value while building the
 * image. ECS can then inject any supported key when the container starts.
 */
function readEnvKeyFromProcessEnv(keys: readonly string[]): string {
  if (typeof process === "undefined") return "";

  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return normalizeEnvValue(value);
  }

  return "";
}

export interface SanityRuntimeConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token: string;
}

function defaultDataset(): string {
  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "production"
  ) {
    return "production";
  }
  return DEFAULT_SANITY_DATASET;
}

function withSanityDefaults(config: SanityRuntimeConfig): SanityRuntimeConfig {
  return {
    projectId: config.projectId || DEFAULT_SANITY_PROJECT_ID,
    dataset: config.dataset || defaultDataset(),
    apiVersion: config.apiVersion || DEFAULT_SANITY_API_VERSION,
    token: config.token || DEFAULT_SANITY_READ_TOKEN,
  };
}

/**
 * Server-only Sanity config.
 * ECS injects SANITY_* (or NEXT_PUBLIC_SANITY_*) at container start (AWS Secrets Manager).
 */
export function getSanityConfigFromEnv(): SanityRuntimeConfig {
  return withSanityDefaults({
    projectId: readEnvKeyFromProcessEnv(SANITY_PROJECT_ID_ENV_KEYS),
    dataset: readEnvKeyFromProcessEnv(SANITY_DATASET_ENV_KEYS),
    apiVersion: readEnvKeyFromProcessEnv(SANITY_API_VERSION_ENV_KEYS),
    token: readEnvKeyFromProcessEnv(SANITY_TOKEN_ENV_KEYS),
  });
}

/** Client-only: values injected by layout via window.__RUNTIME_CONFIG__. */
function readRuntimeConfigSanity(): SanityRuntimeConfig {
  if (typeof window === "undefined") {
    return withSanityDefaults({
      projectId: "",
      dataset: "",
      apiVersion: "",
      token: "",
    });
  }

  const cfg = (
    window as unknown as { __RUNTIME_CONFIG__?: Record<string, string> }
  ).__RUNTIME_CONFIG__;

  return withSanityDefaults({
    projectId: cfg?.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: cfg?.NEXT_PUBLIC_SANITY_DATASET || "",
    apiVersion: cfg?.NEXT_PUBLIC_SANITY_API_VERSION || "",
    token: cfg?.NEXT_PUBLIC_SANITY_READ_TOKEN || "",
  });
}

/**
 * Resolve Sanity config for the current runtime.
 * - Server (Node): SANITY_* / NEXT_PUBLIC_SANITY_* environment variables injected by ECS
 * - Browser: window.__RUNTIME_CONFIG__ (injected in layout), same as the API base URL
 */
export function resolveSanityConfig(): SanityRuntimeConfig {
  if (typeof window === "undefined") {
    return getSanityConfigFromEnv();
  }

  return readRuntimeConfigSanity();
}

/** GROQ filter aligned with OmayaExchangeMobile — all blog documents, any status. */
export const SANITY_BLOG_TYPE_FILTER = `_type == "blog"`;
