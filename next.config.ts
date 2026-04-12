import type { NextConfig } from "next";
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '' : '';
const nextConfig: NextConfig = {
  /* config options here */
  // Removed 'output: export' to enable server-side features (middleware, API routes, auth)
  trailingSlash: true,
  basePath: basePath,
  assetPrefix: basePath,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
