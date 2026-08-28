import { secretsFromEnv, loadSanitySecrets } from "@/sanity/lib/loadSanitySecrets";

export interface SanityRuntimeConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token: string;
}

/** Sync env read only — prefer getSanityConfigFromServer() in production server code. */
export function getSanityConfigFromEnv(): SanityRuntimeConfig {
  return secretsFromEnv();
}

/** Server: ECS env + AWS Secrets Manager (production — same as admin getServerClient). */
export async function getSanityConfigFromServer(): Promise<SanityRuntimeConfig> {
  return loadSanitySecrets();
}

/** Client-only: values injected by layout via window.__RUNTIME_CONFIG__. */
function readRuntimeConfigSanity(): SanityRuntimeConfig {
  if (typeof window === "undefined") {
    return {
      projectId: "",
      dataset: "",
      apiVersion: "",
      token: "",
    };
  }

  const cfg = (
    window as unknown as { __RUNTIME_CONFIG__?: Record<string, string> }
  ).__RUNTIME_CONFIG__;

  return {
    projectId: cfg?.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: cfg?.NEXT_PUBLIC_SANITY_DATASET || "",
    apiVersion: cfg?.NEXT_PUBLIC_SANITY_API_VERSION || "",
    token: cfg?.NEXT_PUBLIC_SANITY_READ_TOKEN || "",
  };
}

/**
 * Resolve Sanity config for the current runtime.
 * - Server: SANITY_* from env / ECS (see loadSanitySecrets for AWS SM)
 * - Browser: window.__RUNTIME_CONFIG__ (injected in layout from server env)
 */
export function resolveSanityConfig(): SanityRuntimeConfig {
  if (typeof window === "undefined") {
    return getSanityConfigFromEnv();
  }

  return readRuntimeConfigSanity();
}

/** GROQ filter — all blog documents (server routes apply published filter for the public site). */
export const SANITY_BLOG_TYPE_FILTER = `_type == "blog"`;
