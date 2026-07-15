"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelect } from "@/components/ui/token-select";
import type { TokenInfo } from "@/lib/addresses";
import { formatUnits } from "@/lib/utils";

/**
 * 通用 输入金额 + 选 token + 展示余额 + max。
 * amount 用字符串,让 UI 自由控制格式,业务侧再 parseUnits。
 */
export function TokenAmountInput({
  label,
  tokens,
  token,
  onTokenChange,
  amount,
  onAmountChange,
  balance,
  decimals = 18,
  disabled,
  readOnly,
}: {
  label: string;
  tokens: TokenInfo[];
  token: `0x${string}` | "";
  onTokenChange: (t: `0x${string}`) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  balance?: bigint;
  decimals?: number;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const balanceStr = balance !== undefined ? formatUnits(balance, decimals) : undefined;

  return (
    <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors duration-150 focus-within:border-[var(--color-primary)]/50">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {balanceStr !== undefined && (
          <button
            type="button"
            disabled={disabled || readOnly || !balance}
            onClick={() => balance && onAmountChange(formatUnits(balance, decimals))}
            className="cursor-pointer text-xs text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            余额: {balanceStr}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            // 只允许一个小数点
            const parts = v.split(".");
            const norm = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : v;
            onAmountChange(norm);
          }}
          className="h-auto border-0 bg-transparent p-0 text-2xl font-medium tabular-nums focus-visible:ring-0"
        />
        <TokenSelect tokens={tokens} value={token} onChange={onTokenChange} disabled={disabled} />
      </div>
    </div>
  );
}
