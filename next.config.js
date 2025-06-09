/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove or comment out the output: 'export' line
  // output: 'export',

  // Add other necessary configurations
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
