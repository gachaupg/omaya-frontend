// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next",
  output: "standalone",
  trailingSlash: true,
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
    ],
  },
  eslint: {
    ignoreDuringBuilds:
      process.env.SKIP_LINT === "true" || process.env.DISABLE_ESLINT === "true",
  },
  typescript: {
    ignoreBuildErrors: process.env.SKIP_LINT === "true",
  },
};

export default nextConfig;
