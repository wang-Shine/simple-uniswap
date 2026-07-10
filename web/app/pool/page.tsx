"use client";

import * as React from "react";
import { useReadContract } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenAmountInput } from "@/components/token-amount-input";
import { ConnectGuard } from "@/components/connect-guard";
import { SIMPLE_ROUTER_ABI, SIMPLE_PAIR_ABI } from "@/lib/abi";
import { getTokens } from "@/lib/addresses";
import { useGuardedChain } from "@/hooks/useGuardedChain";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useApproveIfNeeded } from "@/hooks/useApproveIfNeeded";
import { usePairReserves } from "@/hooks/usePairReserves";
import { useTx } from "@/hooks/useTx";
import {
  applySlippageMin,
  deadline,
  formatUnits,
  parseUnits,
} from "@/lib/utils";
import { quote } from "@/lib/amm";

export default function PoolPage() {
  const { ready, reason } = useGuardedChain();

  return (
    <ConnectGuard ready={ready} reason={reason}>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Pool</CardTitle>
            <CardDescription>做 LP 拿手续费收入,注意无常损失</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add">
              <TabsList className="w-full">
                <TabsTrigger value="add" className="flex-1">添加</TabsTrigger>
                <TabsTrigger value="remove" className="flex-1">移除</TabsTrigger>
              </TabsList>
              <TabsContent value="add"><AddLiquidity /></TabsContent>
              <TabsContent value="remove"><RemoveLiquidity /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ConnectGuard>
  );
}

/* ------------------------------- Add -------------------------------- */

function AddLiquidity() {
  const { address, deployment } = useGuardedChain();
  const tokens = getTokens(deployment);

  const [tokenA, setTokenA] = React.useState<`0x${string}` | "">("");
  const [tokenB, setTokenB] = React.useState<`0x${string}` | "">("");
  const [amountA, setAmountA] = React.useState("");
  const [amountB, setAmountB] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");

  React.useEffect(() => {
    if (!tokenA && tokens[0]) setTokenA(tokens[0].address);
    if (!tokenB && tokens[1]) setTokenB(tokens[1].address);
  }, [tokens, tokenA, tokenB]);

  const aInfo = tokens.find((t) => t.address === tokenA);
  const bInfo = tokens.find((t) => t.address === tokenB);

  const { balance: balA, refetch: refetchA } = useTokenBalance(tokenA || undefined);
  const { balance: balB, refetch: refetchB } = useTokenBalance(tokenB || undefined);
  const {
    reserveA,
    reserveB,
    refetch: refetchReserves,
  } = usePairReserves(deployment?.router, tokenA || undefined, tokenB || undefined);

  const poolExists = reserveA > 0n && reserveB > 0n;

  const amountAWei = parseUnits(amountA || "0", aInfo?.decimals ?? 18);
  const suggestedBWei = poolExists && amountAWei > 0n ? quote(amountAWei, reserveA, reserveB) : 0n;

  const amountBWei = poolExists
    ? suggestedBWei
    : parseUnits(amountB || "0", bInfo?.decimals ?? 18);

  const slipNum = Number(slippage) || 0;
  const amountAMin = applySlippageMin(amountAWei, slipNum);
  const amountBMin = applySlippageMin(amountBWei, slipNum);

  const { ensureApproval: approveA, isApproving: approvingA } = useApproveIfNeeded(
    tokenA || undefined,
    deployment?.router,
    aInfo?.symbol ?? "Token",
  );
  const { ensureApproval: approveB, isApproving: approvingB } = useApproveIfNeeded(
    tokenB || undefined,
    deployment?.router,
    bInfo?.symbol ?? "Token",
  );
  const { sendAsync, isPending } = useTx();

  const disabledReason = React.useMemo(() => {
    if (!tokenA || !tokenB) return "选择代币";
    if (tokenA.toLowerCase() === tokenB.toLowerCase()) return "两个代币不能相同";
    if (amountAWei <= 0n || amountBWei <= 0n) return "输入金额";
    if (amountAWei > balA) return `${aInfo?.symbol} 余额不足`;
    if (amountBWei > balB) return `${bInfo?.symbol} 余额不足`;
    return undefined;
  }, [tokenA, tokenB, amountAWei, amountBWei, balA, balB, aInfo?.symbol, bInfo?.symbol]);

  async function handleAdd() {
    if (!address || !deployment || !tokenA || !tokenB) return;
    try {
      await approveA(amountAWei);
      await approveB(amountBWei);
      await sendAsync({
        address: deployment.router,
        abi: SIMPLE_ROUTER_ABI,
        functionName: "addLiquidity",
        args: [
          tokenA,
          tokenB,
          amountAWei,
          amountBWei,
          amountAMin,
          amountBMin,
          address,
          deadline(20),
        ],
        label: "Add liquidity",
      });
      setAmountA("");
      setAmountB("");
      await Promise.all([refetchA(), refetchB(), refetchReserves()]);
    } catch {}
  }

  return (
    <div className="space-y-3">
      <TokenAmountInput
        label="Token A"
        tokens={tokens}
        token={tokenA}
        onTokenChange={(t) => {
          if (t === tokenB) setTokenB(tokenA);
          setTokenA(t);
        }}
        amount={amountA}
        onAmountChange={setAmountA}
        balance={balA}
        decimals={aInfo?.decimals ?? 18}
      />

      <TokenAmountInput
        label={poolExists ? "Token B (按比例自动算)" : "Token B"}
        tokens={tokens}
        token={tokenB}
        onTokenChange={(t) => {
          if (t === tokenA) setTokenA(tokenB);
          setTokenB(t);
        }}
        amount={poolExists ? formatUnits(suggestedBWei, bInfo?.decimals ?? 18) : amountB}
        onAmountChange={setAmountB}
        balance={balB}
        decimals={bInfo?.decimals ?? 18}
        readOnly={poolExists}
      />

      <SlippageInput value={slippage} onChange={setSlippage} />

      <div className="space-y-1 rounded-md bg-[var(--color-input)] p-3 text-xs">
        <Row
          label="池子状态"
          value={poolExists
            ? `${formatUnits(reserveA, aInfo?.decimals ?? 18)} / ${formatUnits(reserveB, bInfo?.decimals ?? 18)}`
            : "首次加池,两种数量决定初始价格"}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={Boolean(disabledReason) || isPending || approvingA || approvingB}
        onClick={handleAdd}
      >
        {approvingA || approvingB
          ? "Approving..."
          : isPending
            ? "Adding..."
            : (disabledReason ?? "添加流动性")}
      </Button>
    </div>
  );
}

/* ------------------------------ Remove ------------------------------ */

function RemoveLiquidity() {
  const { address, deployment } = useGuardedChain();
  const tokens = getTokens(deployment);

  // 只有 TKA/TKB 一个池子,直接用现成 pair 地址
  const pair = deployment?.pair;
  const tokenA = tokens[0]?.address;
  const tokenB = tokens[1]?.address;
  const aInfo = tokens[0];
  const bInfo = tokens[1];

  const [liquidity, setLiquidity] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");

  const { balance: lpBalance, refetch: refetchLp } = useTokenBalance(pair, address);
  const { data: totalSupply, refetch: refetchTotal } = useReadContract({
    address: pair,
    abi: SIMPLE_PAIR_ABI,
    functionName: "totalSupply",
    query: { enabled: Boolean(pair) },
  });
  const { reserveA, reserveB, refetch: refetchReserves } = usePairReserves(
    deployment?.router,
    tokenA,
    tokenB,
  );

  const total = (totalSupply as bigint | undefined) ?? 0n;
  const liquidityWei = parseUnits(liquidity || "0", 18);
  const expectedA = total > 0n ? (liquidityWei * reserveA) / total : 0n;
  const expectedB = total > 0n ? (liquidityWei * reserveB) / total : 0n;

  const slipNum = Number(slippage) || 0;
  const amountAMin = applySlippageMin(expectedA, slipNum);
  const amountBMin = applySlippageMin(expectedB, slipNum);

  const { ensureApproval, isApproving } = useApproveIfNeeded(pair, deployment?.router, "LP");
  const { sendAsync, isPending } = useTx();

  const disabledReason =
    !pair || !tokenA || !tokenB
      ? "还未部署 pair"
      : liquidityWei <= 0n
        ? "输入要移除的 LP 数量"
        : liquidityWei > lpBalance
          ? "LP 余额不足"
          : undefined;

  async function handleRemove() {
    if (!address || !deployment || !tokenA || !tokenB) return;
    try {
      await ensureApproval(liquidityWei);
      await sendAsync({
        address: deployment.router,
        abi: SIMPLE_ROUTER_ABI,
        functionName: "removeLiquidity",
        args: [tokenA, tokenB, liquidityWei, amountAMin, amountBMin, address, deadline(20)],
        label: "Remove liquidity",
      });
      setLiquidity("");
      await Promise.all([refetchLp(), refetchTotal(), refetchReserves()]);
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] p-3">
        <div className="flex items-center justify-between">
          <Label>要 burn 的 LP</Label>
          <button
            type="button"
            onClick={() => setLiquidity(formatUnits(lpBalance, 18))}
            disabled={lpBalance === 0n}
            className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-50"
          >
            余额: {formatUnits(lpBalance, 18)}
          </button>
        </div>
        <Input
          inputMode="decimal"
          placeholder="0.0"
          value={liquidity}
          onChange={(e) => setLiquidity(e.target.value.replace(/[^0-9.]/g, ""))}
          className="border-0 bg-transparent text-lg font-medium focus-visible:ring-0"
        />
      </div>

      <SlippageInput value={slippage} onChange={setSlippage} />

      <div className="space-y-1 rounded-md bg-[var(--color-input)] p-3 text-xs">
        <Row
          label={`预计取回 ${aInfo?.symbol ?? "A"}`}
          value={formatUnits(expectedA, aInfo?.decimals ?? 18)}
        />
        <Row
          label={`预计取回 ${bInfo?.symbol ?? "B"}`}
          value={formatUnits(expectedB, bInfo?.decimals ?? 18)}
        />
        <Row label="LP 总量" value={formatUnits(total, 18)} />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={Boolean(disabledReason) || isPending || isApproving}
        onClick={handleRemove}
      >
        {isApproving ? "Approving..." : isPending ? "Removing..." : (disabledReason ?? "移除流动性")}
      </Button>
    </div>
  );
}

/* ------------------------------ Shared ------------------------------ */

function SlippageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-xs">
      <Label className="normal-case tracking-normal">滑点</Label>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="h-8 w-16 text-xs"
        />
        <span className="text-[var(--color-muted-foreground)]">%</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
