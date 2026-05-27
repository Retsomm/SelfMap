import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'sharp', '@swisseph/browser'],
  turbopack: {},
  webpack(config, { isServer }) {
    // 停用 persistent cache，確保 loader 修改每次都被套用
    config.cache = { type: 'memory' }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    if (isServer) {
      // @swisseph/browser 是瀏覽器專用 WASM，server bundle 完全排除
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)
      config.externals = [...existing, '@swisseph/browser']
    } else {
      // @swisseph/browser 的 ESM bundle 內部使用了 CJS 的 exports 變數
      // 在 client bundle 注入 shim 讓它不報錯
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
