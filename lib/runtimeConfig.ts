import { getApiBaseUrlFromEnv } from '@/config/api';

export type PublicRuntimeConfig = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_FACEBOOK_APP_ID: string;
  NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: string;
};

let cachedConfig: PublicRuntimeConfig | null = null;

function readPublicRuntimeConfigFromEnv(): PublicRuntimeConfig {
  return {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
    NEXT_PUBLIC_API_URL: getApiBaseUrlFromEnv(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
      process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '',
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
