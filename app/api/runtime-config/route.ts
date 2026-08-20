import { NextResponse } from 'next/server';
import { getApiBaseUrlFromEnv } from '@/config/api';
import { getSanityConfigFromEnv } from '@/config/sanity';
import { getChatwootConfigFromEnv } from '@/config/chatwoot';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Only expose safe, public values
export async function GET() {
  const sanityConfig = getSanityConfigFromEnv();
  const chatwootConfig = getChatwootConfigFromEnv();

  return NextResponse.json({
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
    NEXT_PUBLIC_BASE_URL: getApiBaseUrlFromEnv(),
    VITE_BASE_URL: getApiBaseUrlFromEnv(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '',
    NEXT_PUBLIC_SANITY_PROJECT_ID: sanityConfig.projectId,
    NEXT_PUBLIC_SANITY_DATASET: sanityConfig.dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: sanityConfig.apiVersion,
    NEXT_PUBLIC_SANITY_READ_TOKEN: sanityConfig.token,
    NEXT_PUBLIC_CHATWOOT_BASE_URL: chatwootConfig.baseUrl,
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: chatwootConfig.websiteToken,
  });
}
