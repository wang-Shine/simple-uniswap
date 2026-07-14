import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // wagmi / rainbowkit 依赖需要在 transpilePackages 里,避免 SSR 报错
  transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  webpack: (config) => {
    // rainbowkit 依赖 pino-pretty 但只在浏览器不必要
    config.externals.push("pino-pretty");
    // @metamask/sdk 里有条 React Native 分支会 import 这个包,纯 Web 项目用不到,
    // 用 alias 指向 false 让 webpack 把它当空模块处理,避免 Module not found 报错
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    return config;
  },
};

export default nextConfig;
