"use client";

/**
 * Pairs 页面 —— 展示 Factory 里所有交易对
 *
 * 流程:
 *   1. factory.allPairsLength() 拿到总数
 *   2. 每个 index 调 factory.allPairs(i) 拿 pair 地址
 *   3. 每个 pair 调 token0/token1/getReserves 拿详情
 */

import * as React from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectGuard } from "@/components/connect-guard";
import { SIMPLE_FACTORY_ABI, SIMPLE_PAIR_ABI, TEST_TOKEN_ABI } from "@/lib/abi";
import { useGuardedChain } from "@/hooks/useGuardedChain";
import { formatUnits, shortAddr } from "@/lib/utils";

export default function PairsPage() {
  const { ready, reason, deployment } = useGuardedChain();
  const factory = deployment?.factory;

  // 1) 总数
  const { data: lenRaw, isLoading: lenLoading } = useReadContract({
    address: factory,
    abi: SIMPLE_FACTORY_ABI,
    functionName: "allPairsLength",
    query: { enabled: Boolean(factory) },
  });
  const len = Number((lenRaw as bigint | undefined) ?? 0n);

  // 2) 所有 pair 地址(批量)
  const { data: pairAddrsRaw } = useReadContracts({
    contracts: factory && len > 0
      ? Array.from({ length: len }).map((_, i) => ({
          address: factory,
          abi: SIMPLE_FACTORY_ABI,
          functionName: "allPairs",
          args: [BigInt(i)],
        } as const))
      : [],
    query: { enabled: Boolean(factory) && len > 0 },
  });
  const pairAddrs = React.useMemo(
    () => (pairAddrsRaw ?? []).map((r) => r.result as `0x${string}` | undefined).filter(Boolean) as `0x${string}`[],
    [pairAddrsRaw],
  );

  return (
    <ConnectGuard ready={ready} reason={reason}>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">交易对</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Factory: {factory ? shortAddr(factory) : "-"} · 共 {lenLoading ? "…" : len} 个
          </p>
        </div>

        {len === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
              还没有交易对。去 Pool 页面加一笔流动性就会自动创建。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pairAddrs.map((addr) => (
              <PairCard key={addr} pair={addr} />
            ))}
          </div>
        )}
      </div>
    </ConnectGuard>
  );
}

function PairCard({ pair }: { pair: `0x${string}` }) {
  // 一次批量读 token0 / token1 / reserves / totalSupply
  const { data } = useReadContracts({
    contracts: [
      { address: pair, abi: SIMPLE_PAIR_ABI, functionName: "token0" } as const,
      { address: pair, abi: SIMPLE_PAIR_ABI, functionName: "token1" } as const,
      { address: pair, abi: SIMPLE_PAIR_ABI, functionName: "getReserves" } as const,
      { address: pair, abi: SIMPLE_PAIR_ABI, functionName: "totalSupply" } as const,
    ],
  });
  const token0 = data?.[0]?.result as `0x${string}` | undefined;
  const token1 = data?.[1]?.result as `0x${string}` | undefined;
  const reserves = data?.[2]?.result as readonly [bigint, bigint] | undefined;
  const totalSupply = data?.[3]?.result as bigint | undefined;

  const sym0 = useSymbol(token0);
  const sym1 = useSymbol(token1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {sym0 ?? "?"} / {sym1 ?? "?"}
        </CardTitle>
        <CardDescription>pair {shortAddr(pair)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        <Row
          label={`${sym0 ?? "token0"} 储备`}
          value={reserves ? formatUnits(reserves[0], 18) : "…"}
        />
        <Row
          label={`${sym1 ?? "token1"} 储备`}
          value={reserves ? formatUnits(reserves[1], 18) : "…"}
        />
        <Row label="LP 总供应" value={totalSupply !== undefined ? formatUnits(totalSupply, 18) : "…"} />
      </CardContent>
    </Card>
  );
}

function useSymbol(token?: `0x${string}`) {
  const { data } = useReadContract({
    address: token,
    abi: TEST_TOKEN_ABI,
    functionName: "symbol",
    query: { enabled: Boolean(token) },
  });
  return data as string | undefined;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
