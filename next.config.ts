import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@swisseph/browser'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
  headers: async () => [
    {
      source: '/:path*.wasm',
      headers: [
        { key: 'Content-Type', value: 'application/wasm' },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    config.cache = { type: 'memory' }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)
      config.externals = [...existing, '@swisseph/browser']
    } else {
      config.module.rules.push({
        test: /swisseph-browser\.js$/,
        enforce: 'pre',
        loader: path.resolve('./loaders/exports-shim.js'),
      })
    }

    return config
  },
};

export default nextConfig;
