import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // wagmi / rainbowkit 依赖需要在 transpilePackages 里,避免 SSR 报错
  transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  webpack: (config) => {
    // rainbowkit 依赖 pino-pretty 但只在浏览器不必要
    config.externals.push("pino-pretty");
    return config;
  },
};

export default nextConfig;
