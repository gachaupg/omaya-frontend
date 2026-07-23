import { NextResponse } from 'next/server';
import { getApiBaseUrlFromEnv } from '@/config/api';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Only expose safe, public values
export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
    VITE_BASE_URL: getApiBaseUrlFromEnv(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '',
  });
}
