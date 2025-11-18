// next.config.ts
import type { NextConfig } from "next";

// Validate critical env vars at build time (production only)
if (process.env.NODE_ENV === 'production') {
  const requiredEnv = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_URL',
  ];
  const missing = requiredEnv.filter((k) => !process.env[k] || process.env[k] === '');
  if (missing.length) {
    throw new Error(
      `Missing required environment variables for production build: ${missing.join(', ')}. ` +
      `Ensure your CI/CD or Docker build args provide these values.`
    );
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true,
  reactStrictMode: true,
  
  // Explicitly expose environment variables to the browser
  env: {
    // Google OAuth
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    
    // API Configuration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // Facebook OAuth
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI,
    
    // Sanity Configuration
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
    NEXT_PUBLIC_SANITY_READ_TOKEN: process.env.NEXT_PUBLIC_SANITY_READ_TOKEN,
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
