export type PublicRuntimeConfig = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_FACEBOOK_APP_ID: string;
  NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: string;
};

let cachedConfig: PublicRuntimeConfig | null = null;

// Hardcoded safe public defaults (non-secret). Used only if env vars are missing.
const DEFAULTS: PublicRuntimeConfig = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID:
    '866830600136-044nv75li085t9ketdpo3ggvgelhd2h7.apps.googleusercontent.com',
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: 'https://dev.omaya.io/auth/google/callback',
  NEXT_PUBLIC_API_URL: 'https://dev.backend.omaya.io',
  NEXT_PUBLIC_APP_URL: 'https://dev.omaya.io',
  NEXT_PUBLIC_FACEBOOK_APP_ID: '1780672032637984',
  NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: 'https://dev.omaya.io/auth/facebook/callback',
};

export async function loadRuntimeConfig(): Promise<PublicRuntimeConfig> {
  if (typeof window === 'undefined') {
    // Server side: read directly from env
    return {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID:
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULTS.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || DEFAULTS.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL || DEFAULTS.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || DEFAULTS.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_FACEBOOK_APP_ID:
        process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || DEFAULTS.NEXT_PUBLIC_FACEBOOK_APP_ID,
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
        process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || DEFAULTS.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI,
    };
  }

  if (cachedConfig) return cachedConfig;

  const res = await fetch('/api/runtime-config', { cache: 'no-store' });
  if (!res.ok) {
    // Fallback to defaults if API route fails
    cachedConfig = { ...DEFAULTS };
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
      NEXT_PUBLIC_GOOGLE_CLIENT_ID:
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULTS.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || DEFAULTS.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL || DEFAULTS.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || DEFAULTS.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_FACEBOOK_APP_ID:
        process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || DEFAULTS.NEXT_PUBLIC_FACEBOOK_APP_ID,
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
        process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || DEFAULTS.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI,
    };
  }
  return (
    cachedConfig ||
    (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) || {
      ...DEFAULTS,
    }
  );
}
