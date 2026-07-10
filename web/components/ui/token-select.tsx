"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TokenInfo } from "@/lib/addresses";

/**
 * 简单 token 下拉:一个原生 <select>,样式跟 Input 一致。
 * 我们只有 TKA/TKB,不做 modal 大 UI。
 */
export function TokenSelect({
  tokens,
  value,
  onChange,
  className,
  disabled,
}: {
  tokens: TokenInfo[];
  value: `0x${string}` | "";
  onChange: (addr: `0x${string}`) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled || tokens.length === 0}
      onChange={(e) => onChange(e.target.value as `0x${string}`)}
      className={cn(
        "h-10 min-w-24 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {tokens.length === 0 && <option value="">--</option>}
      {tokens.map((t) => (
        <option key={t.address} value={t.address}>
          {t.symbol}
        </option>
      ))}
    </select>
  );
}
