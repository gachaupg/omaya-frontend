import { resolveApiBaseUrl } from '@/config/api';
import { getSanityConfigFromEnv } from '@/config/sanity';
import { getChatwootConfigFromEnv } from '@/config/chatwoot';

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

function readPublicRuntimeConfigFromEnv(): PublicRuntimeConfig {
  const apiBaseUrl = resolveApiBaseUrl();
  const sanityConfig = getSanityConfigFromEnv();
  const chatwootConfig = getChatwootConfigFromEnv();
  return {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
    NEXT_PUBLIC_BASE_URL: apiBaseUrl,
    VITE_BASE_URL: apiBaseUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
      process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '',
    NEXT_PUBLIC_SANITY_PROJECT_ID: sanityConfig.projectId,
    NEXT_PUBLIC_SANITY_DATASET: sanityConfig.dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: sanityConfig.apiVersion,
    NEXT_PUBLIC_SANITY_READ_TOKEN: sanityConfig.token,
    NEXT_PUBLIC_CHATWOOT_BASE_URL: chatwootConfig.baseUrl,
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: chatwootConfig.websiteToken,
  };
}

export async function loadRuntimeConfig(): Promise<PublicRuntimeConfig> {
  if (typeof window === 'undefined') {
    return readPublicRuntimeConfigFromEnv();
  }

  if (cachedConfig) return cachedConfig;

  const res = await fetch('/api/runtime-config', { cache: 'no-store' });
  if (!res.ok) {
    cachedConfig = readPublicRuntimeConfigFromEnv();
    return cachedConfig;
  }
  cachedConfig = (await res.json()) as PublicRuntimeConfig;
  try {
    (window as any).__RUNTIME_CONFIG__ = cachedConfig;
  } catch {}
  return cachedConfig;
}

export function getRuntimeConfigSync(): PublicRuntimeConfig {
  if (typeof window === 'undefined') {
    return readPublicRuntimeConfigFromEnv();
  }
  return (
    cachedConfig ||
    (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) ||
    readPublicRuntimeConfigFromEnv()
  );
}
