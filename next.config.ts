import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Configure WASM and related files loader
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Handle symlinked files
    config.resolve.symlinks = true;

    // Add fallbacks for WASM compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
    };

    // Fix MetaMask SDK React Native dependency issue
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "linera-protocol/linera-web/dist/linera_web.js": path.resolve(
        __dirname,
        "public/js/@linera/client/linera_web.js"
      ),
    };

    // External modules - CRITICAL: @linera/client must NOT be bundled
    if (!isServer) {
      config.externals = [...(config.externals || []), "@linera/client"];
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

          // DYNAMIC AUTH
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
