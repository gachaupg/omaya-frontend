import { getApiBaseUrlFromEnv } from "@/config/api";
import { getSanityConfigFromEnv } from "@/config/sanity";

/** Inline script: expose server runtime env to the browser before app bundles load. */
export function buildServerRuntimeConfigScript(): string {
  const apiBaseUrl = getApiBaseUrlFromEnv();
  const sanityConfig = getSanityConfigFromEnv();

  const sanityReadToken =
    process.env.NEXT_PUBLIC_SANITY_READ_TOKEN?.trim() || sanityConfig.token;

  const payload = JSON.stringify({
    NEXT_PUBLIC_BASE_URL: apiBaseUrl,
    VITE_BASE_URL: apiBaseUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "",
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
      process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || "",
    NEXT_PUBLIC_SANITY_PROJECT_ID: sanityConfig.projectId,
    NEXT_PUBLIC_SANITY_DATASET: sanityConfig.dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: sanityConfig.apiVersion,
    NEXT_PUBLIC_SANITY_READ_TOKEN: sanityReadToken,
  });

  return `(function(){try{window.__RUNTIME_CONFIG__=Object.assign(window.__RUNTIME_CONFIG__||{},${payload});}catch(e){}})();`;
}
