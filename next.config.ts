// next.config.ts
import type { NextConfig } from "next";

// Validate build-time-only variables in production. The API URL is
// intentionally excluded because ECS injects it when the container starts.
if (process.env.NODE_ENV === 'production') {
  const requiredEnv = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'NEXT_PUBLIC_APP_URL',
  ];
  const missing = requiredEnv.filter((k) => !process.env[k] || process.env[k] === '');
  if (missing.length) {
    // Missing env at build time — rely on runtime configuration.
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: true,
  },
  outputFileTracingIncludes: {
    '/legal/[slug]': ['./content/legal/**/*'],
  },
  async headers() {
    // Prevent document caching on auth/protected routes.
    // This avoids serving cached RSC flight payloads as full HTML pages on back/forward.
    const noStoreHeaders = [
      { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
      { key: "Surrogate-Control", value: "no-store" },
    ];

    return [
      { source: "/", headers: noStoreHeaders },
      { source: "/auth/:path*", headers: noStoreHeaders },
      { source: "/dashboard/:path*", headers: noStoreHeaders },
      { source: "/live-chat/:path*", headers: noStoreHeaders },
      { source: "/contactUs/:path*", headers: noStoreHeaders },
    ];
  },
  // Fix vendor-chunks/@sanity.js module resolution - keep Sanity packages external
  serverExternalPackages: ['@sanity/client', '@sanity/image-url', 'next-sanity', 'sanity'],
  
  // Explicitly expose environment variables to the browser
  env: {
    // Google OAuth
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // Facebook OAuth
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI,
    
    // Sanity Configuration
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
    NEXT_PUBLIC_SANITY_READ_TOKEN: process.env.NEXT_PUBLIC_SANITY_READ_TOKEN,

    // Web Push (browser notifications when user is away)
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "omayabucket.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds:
      process.env.SKIP_LINT === "true" || process.env.DISABLE_ESLINT === "true",
  },
  typescript: {
    ignoreBuildErrors: process.env.SKIP_LINT === "true",
  },
  webpack: (config, { isServer }) => {
    // Fix for face-api.js trying to use Node.js modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
