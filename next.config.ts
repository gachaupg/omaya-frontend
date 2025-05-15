// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "dist",
  output: "export",
  trailingSlash: true,
  images: {
    domains: ["res.cloudinary.com"],
    unoptimized: true,
  },
};

export default nextConfig;
