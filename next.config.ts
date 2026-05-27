import type { NextConfig } from "next";
import path from "path";

const isTurbopackAuto = process.env.TURBOPACK === 'auto'

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'sharp', '@swisseph/browser'],
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    rules: {
      '**/swisseph-browser.js': {
        loaders: [path.resolve('./loaders/exports-shim.js')],
        as: '*.js',
      },
    },
  },
  webpack: isTurbopackAuto ? undefined : (config, { isServer }) => {
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
