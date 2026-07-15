"use client";

import * as React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId, networks, defaultChain } from "@/lib/wagmi";
import { ToastProvider } from "@/components/ui/toast";

// 站点 URL 会传给钱包端显示"你正在连接谁"
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// AppKit 是单例,只能初始化一次,放在模块顶层执行
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...networks],
  defaultNetwork: defaultChain,
  metadata: {
    name: "SimpleDEX",
    description: "简化版 Uniswap V2 学习项目",
    url: appUrl,
    icons: [],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
