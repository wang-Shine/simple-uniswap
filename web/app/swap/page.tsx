"use client";

import * as React from "react";
import { ArrowDownUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TokenAmountInput } from "@/components/token-amount-input";
import { ConnectGuard } from "@/components/connect-guard";
import { SIMPLE_ROUTER_ABI } from "@/lib/abi";
import { getTokens } from "@/lib/addresses";
import { useGuardedChain } from "@/hooks/useGuardedChain";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useApproveIfNeeded } from "@/hooks/useApproveIfNeeded";
import { useTx } from "@/hooks/useTx";
import { usePairReserves } from "@/hooks/usePairReserves";
import { applySlippageMin, deadline, formatUnits, parseUnits } from "@/lib/utils";
import { getAmountOut } from "@/lib/amm";

export default function SwapPage() {
  const { address, deployment, ready, reason } = useGuardedChain();
  const tokens = getTokens(deployment);

  const [tokenIn, setTokenIn] = React.useState<`0x${string}` | "">("");
  const [tokenOut, setTokenOut] = React.useState<`0x${string}` | "">("");
  const [amountIn, setAmountIn] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");
  React.useEffect(() => {
    if (!tokenIn && tokens[0]) setTokenIn(tokens[0].address);
    if (!tokenOut && tokens[1]) setTokenOut(tokens[1].address);
  }, [tokens, tokenIn, tokenOut]);

  const inInfo = tokens.find((t) => t.address === tokenIn);
  const outInfo = tokens.find((t) => t.address === tokenOut);

  const { balance: balIn, refetch: refetchIn } = useTokenBalance(tokenIn || undefined);
  const { balance: balOut, refetch: refetchOut } = useTokenBalance(tokenOut || undefined);
  const { reserveA: reserveIn, reserveB: reserveOut, refetch: refetchReserves } = usePairReserves(
    deployment?.router,
    tokenIn || undefined,
    tokenOut || undefined,
  );

  const amountInWei = parseUnits(amountIn || "0", inInfo?.decimals ?? 18);
  const previewOut = getAmountOut(amountInWei, reserveIn, reserveOut);
  const slipNum = Number(slippage) || 0;
  const amountOutMin = applySlippageMin(previewOut, slipNum);

  const { ensureApproval, isApproving } = useApproveIfNeeded(
    tokenIn || undefined,
    deployment?.router,
    inInfo?.symbol ?? "Token",
  );
  const { sendAsync, isPending } = useTx();

  const disabledReason = React.useMemo(() => {
    if (!ready) return reason;
    if (!tokenIn || !tokenOut) return "选择代币";
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) return "两个代币不能相同";
    if (reserveIn === 0n || reserveOut === 0n) return "池子还没有流动性";
    if (amountInWei <= 0n) return "输入金额";
    if (amountInWei > balIn) return `${inInfo?.symbol} 余额不足`;
    if (previewOut <= 0n) return "换算金额为 0";
    return undefined;
  }, [ready, reason, tokenIn, tokenOut, reserveIn, reserveOut, amountInWei, balIn, previewOut, inInfo?.symbol]);

  async function handleSwap() {
    if (!address || !deployment || !tokenIn || !tokenOut) return;
    try {
      await ensureApproval(amountInWei);
      await sendAsync({
        address: deployment.router,
        abi: SIMPLE_ROUTER_ABI,
        functionName: "swapExactTokensForTokens",
        args: [amountInWei, amountOutMin, [tokenIn, tokenOut], address, deadline(20)],
        label: `Swap ${inInfo?.symbol}→${outInfo?.symbol}`,
      });
      setAmountIn("");
      await Promise.all([refetchIn(), refetchOut(), refetchReserves()]);
    } catch {}
  }

  function flip() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
  }

  return (
    <ConnectGuard ready={ready} reason={reason}>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Swap</CardTitle>
            <CardDescription>x·y=k 恒定乘积，含 0.3% 手续费</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <TokenAmountInput
              label="From"
              tokens={tokens}
              token={tokenIn}
              onTokenChange={(t) => {
                if (t === tokenOut) setTokenOut(tokenIn);
                setTokenIn(t);
              }}
              amount={amountIn}
              onAmountChange={setAmountIn}
              balance={balIn}
              decimals={inInfo?.decimals ?? 18}
            />

            <div className="flex justify-center">
              <button
                type="button"
                onClick={flip}
                aria-label="交换代币方向"
                className="cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-[var(--color-muted-foreground)] transition-colors duration-150 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
              >
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>

            <TokenAmountInput
              label="To (预估)"
              tokens={tokens}
              token={tokenOut}
              onTokenChange={(t) => {
                if (t === tokenIn) setTokenIn(tokenOut);
                setTokenOut(t);
              }}
              amount={previewOut > 0n ? formatUnits(previewOut, outInfo?.decimals ?? 18) : ""}
              onAmountChange={() => {}}
              balance={balOut}
              decimals={outInfo?.decimals ?? 18}
              readOnly
            />

            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs">
              <Label className="normal-case tracking-normal">滑点</Label>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="h-8 w-16 text-xs"
                />
                <span className="text-[var(--color-muted-foreground)]">%</span>
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl bg-[var(--color-surface)] p-3 text-xs">
              <Row
                label="最少收到"
                value={`${formatUnits(amountOutMin, outInfo?.decimals ?? 18)} ${outInfo?.symbol ?? ""}`}
              />
              <Row
                label="池子储备"
                value={
                  reserveIn > 0n && inInfo && outInfo
                    ? `${formatUnits(reserveIn, inInfo.decimals)} ${inInfo.symbol} / ${formatUnits(reserveOut, outInfo.decimals)} ${outInfo.symbol}`
                    : "—"
                }
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={Boolean(disabledReason) || isPending || isApproving}
              onClick={handleSwap}
            >
              {isApproving
                ? "Approving..."
                : isPending
                  ? "Swapping..."
                  : (disabledReason ?? `Swap ${inInfo?.symbol} → ${outInfo?.symbol}`)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConnectGuard>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
