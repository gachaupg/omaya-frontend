import { getApiBaseUrlFromEnv } from "@/config/api";
import { getChatwootConfigFromEnv } from "@/config/chatwoot";
import { loadSanitySecrets } from "@/sanity/lib/loadSanitySecrets";

/** Server runtime public config — ECS env + AWS Secrets Manager (same as admin API routes). */
export async function loadServerPublicRuntimeConfig() {
  const apiBaseUrl = getApiBaseUrlFromEnv();
  const sanitySecrets = await loadSanitySecrets();
  const chatwootConfig = getChatwootConfigFromEnv();

  return {
    NEXT_PUBLIC_BASE_URL: apiBaseUrl,
    VITE_BASE_URL: apiBaseUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "",
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
      process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || "",
    NEXT_PUBLIC_SANITY_PROJECT_ID: sanitySecrets.projectId,
    NEXT_PUBLIC_SANITY_DATASET: sanitySecrets.dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: sanitySecrets.apiVersion,
    NEXT_PUBLIC_SANITY_READ_TOKEN: sanitySecrets.token,
    NEXT_PUBLIC_CHATWOOT_BASE_URL: chatwootConfig.baseUrl,
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: chatwootConfig.websiteToken,
  };
}

/** Inline script: expose server runtime env to the browser before app bundles load. */
export async function buildServerRuntimeConfigScript(): Promise<string> {
  const payload = JSON.stringify(await loadServerPublicRuntimeConfig());

  return `(function(){try{window.__RUNTIME_CONFIG__=Object.assign(window.__RUNTIME_CONFIG__||{},${payload});}catch(e){}})();`;
}
