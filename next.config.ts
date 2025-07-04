// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Resolve issues with leaflet in Next.js
    config.resolve = {
      ...(config.resolve || {}),
      fallback: {
        ...(config.resolve?.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      },
    };
    return config;
  },
};

export default nextConfig;
