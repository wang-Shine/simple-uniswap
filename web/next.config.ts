import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // wagmi / rainbowkit 依赖需要在 transpilePackages 里,避免 SSR 报错
  transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  // Next.js 16 默认用 Turbopack 构建,原来的 webpack() 自定义配置需要迁移成 turbopack 配置
  // resolveAlias 只支持字符串路径,不支持 webpack 那种 { browser: ... } 对象或 false,
  // 所以统一指向一个空模块 shim 文件
  turbopack: {
    resolveAlias: {
      // rainbowkit 依赖 pino-pretty 但只在浏览器不必要
      "pino-pretty": "./shims/empty.js",
      // @metamask/sdk 里有条 React Native 分支会 import 这个包,纯 Web 项目用不到
      "@react-native-async-storage/async-storage": "./shims/empty.js",
    },
  },
};

export default nextConfig;
