import type { NextConfig } from "next";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@swisseph/browser'],
  experimental: {
    optimizePackageImports: ['react-hot-toast', '@clerk/nextjs', 'lucide-react', 'framer-motion'],
  },
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

    // asyncWebAssembly 讓 webpack 識別 .wasm 格式；
    // 客戶端的 asset/resource 規則（下方）會覆蓋 webassembly/async，
    // 將 WASM 複製至 /_next/static/chunks/<hash>.wasm 並回傳 URL
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)
      config.externals = [...existing, '@swisseph/browser']
    } else {
      // build 時將 WASM 複製至 /_next/static/chunks/swisseph.wasm
      // 確保 Vercel 部署包含此檔案，路徑固定可靠
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: require.resolve('@swisseph/browser/dist/swisseph.wasm'),
              to: 'static/chunks/swisseph.wasm',
            },
          ],
        })
      )

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
