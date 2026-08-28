import { resolveApiBaseUrl } from "@/config/api";
import { getChatwootConfigFromEnv } from "@/config/chatwoot";
import { loadServerPublicRuntimeConfig } from "@/lib/serverRuntimeConfigScript";

export type PublicRuntimeConfig = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: string;
  NEXT_PUBLIC_BASE_URL: string;
  VITE_BASE_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_FACEBOOK_APP_ID: string;
  NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: string;
  NEXT_PUBLIC_SANITY_PROJECT_ID: string;
  NEXT_PUBLIC_SANITY_DATASET: string;
  NEXT_PUBLIC_SANITY_API_VERSION: string;
  NEXT_PUBLIC_SANITY_READ_TOKEN: string;
  NEXT_PUBLIC_CHATWOOT_BASE_URL: string;
  NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: string;
};

let cachedConfig: PublicRuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<PublicRuntimeConfig> {
  if (typeof window === "undefined") {
    return loadServerPublicRuntimeConfig();
  }

  if (cachedConfig) return cachedConfig;

  const res = await fetch("/api/runtime-config", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load runtime config (${res.status})`);
  }
  cachedConfig = (await res.json()) as PublicRuntimeConfig;
  try {
    (window as unknown as { __RUNTIME_CONFIG__?: PublicRuntimeConfig }).__RUNTIME_CONFIG__ =
      cachedConfig;
  } catch {
    // ignore
  }
  return cachedConfig;
}

export function getRuntimeConfigSync(): PublicRuntimeConfig {
  if (typeof window === "undefined") {
    throw new Error("getRuntimeConfigSync() is client-only; use loadRuntimeConfig() on the server");
  }
  return (
    cachedConfig ||
    (window as unknown as { __RUNTIME_CONFIG__?: PublicRuntimeConfig })
      .__RUNTIME_CONFIG__ || {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "",
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI: "",
      NEXT_PUBLIC_BASE_URL: "",
      VITE_BASE_URL: "",
      NEXT_PUBLIC_APP_URL: "",
      NEXT_PUBLIC_FACEBOOK_APP_ID: "",
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: "",
      NEXT_PUBLIC_SANITY_PROJECT_ID: "",
      NEXT_PUBLIC_SANITY_DATASET: "",
      NEXT_PUBLIC_SANITY_API_VERSION: "",
      NEXT_PUBLIC_SANITY_READ_TOKEN: "",
      NEXT_PUBLIC_CHATWOOT_BASE_URL: "",
      NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: "",
    }
  );
}
