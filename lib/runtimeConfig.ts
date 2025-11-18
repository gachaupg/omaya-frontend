export type PublicRuntimeConfig = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_FACEBOOK_APP_ID: string;
  NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: string;
};

let cachedConfig: PublicRuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<PublicRuntimeConfig> {
  if (typeof window === 'undefined') {
    // Server side: read directly from env
    return {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://dev.backend.omaya.io',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://dev.omaya.io',
      NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '',
    };
  }

  if (cachedConfig) return cachedConfig;

  const res = await fetch('/api/runtime-config', { cache: 'no-store' });
  if (!res.ok) {
    // Fallback to defaults if API route fails
    cachedConfig = {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: '',
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI: '',
      NEXT_PUBLIC_API_URL: 'https://dev.backend.omaya.io',
      NEXT_PUBLIC_APP_URL: 'https://dev.omaya.io',
      NEXT_PUBLIC_FACEBOOK_APP_ID: '',
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: '',
    };
    return cachedConfig;
  }
  cachedConfig = (await res.json()) as PublicRuntimeConfig;
  // Optionally expose on window for ad-hoc access
  try {
    (window as any).__RUNTIME_CONFIG__ = cachedConfig;
  } catch {}
  return cachedConfig;
}

export function getRuntimeConfigSync(): PublicRuntimeConfig {
  if (typeof window === 'undefined') {
    return {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://dev.backend.omaya.io',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://dev.omaya.io',
      NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '',
    };
  }
  return (
    cachedConfig ||
    (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) || {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: '',
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI: '',
      NEXT_PUBLIC_API_URL: 'https://dev.backend.omaya.io',
      NEXT_PUBLIC_APP_URL: 'https://dev.omaya.io',
      NEXT_PUBLIC_FACEBOOK_APP_ID: '',
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: '',
    }
  );
}
