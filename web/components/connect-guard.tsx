"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * 各功能页共享的"未连接/未部署"占位。ready 时才渲染 children。
 */
export function ConnectGuard({
  ready,
  reason,
  children,
}: {
  ready: boolean;
  reason?: string;
  children: React.ReactNode;
}) {
  if (ready) return <>{children}</>;
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center">
      <div className="text-sm text-[var(--color-muted-foreground)]">{reason ?? "尚未就绪"}</div>
      <ConnectButton showBalance={false} accountStatus="address" />
    </div>
  );
}
