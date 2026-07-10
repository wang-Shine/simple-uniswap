"use client";

/**
 * Faucet 页面 —— 领 TKA / TKB 测试币
 *
 * 每个地址每种代币只能领一次(合约里存了 hasClaimed 映射)。
 */

import * as React from "react";
import { useReadContract } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectGuard } from "@/components/connect-guard";
import { TEST_TOKEN_ABI } from "@/lib/abi";
import { getTokens, type TokenInfo } from "@/lib/addresses";
import { useGuardedChain } from "@/hooks/useGuardedChain";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTx } from "@/hooks/useTx";
import { formatUnits, shortAddr } from "@/lib/utils";

export default function FaucetPage() {
  const { ready, reason, deployment } = useGuardedChain();
  const tokens = getTokens(deployment);

  return (
    <ConnectGuard ready={ready} reason={reason}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Faucet</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            每个地址每种代币只能领一次,数量由合约常量 FAUCET_AMOUNT 决定。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {tokens.map((t) => (
            <FaucetCard key={t.address} token={t} />
          ))}
        </div>
      </div>
    </ConnectGuard>
  );
}

function FaucetCard({ token }: { token: TokenInfo }) {
  const { address } = useGuardedChain();
  const { balance, refetch: refetchBal } = useTokenBalance(token.address);

  const { data: claimed, refetch: refetchClaimed } = useReadContract({
    address: token.address,
    abi: TEST_TOKEN_ABI,
    functionName: "hasClaimed",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: amount } = useReadContract({
    address: token.address,
    abi: TEST_TOKEN_ABI,
    functionName: "FAUCET_AMOUNT",
  });

  const { sendAsync, isPending } = useTx();

  async function handleClaim() {
    try {
      await sendAsync({
        address: token.address,
        abi: TEST_TOKEN_ABI,
        functionName: "faucet",
        args: [],
        label: `Claim ${token.symbol}`,
      });
      await Promise.all([refetchBal(), refetchClaimed()]);
    } catch {
      /* toast 已弹 */
    }
  }

  const hasClaimed = Boolean(claimed);
  const amountStr = amount ? formatUnits(amount as bigint, token.decimals) : "…";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{token.symbol}</CardTitle>
        <CardDescription>
          {token.name} · {shortAddr(token.address)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-muted-foreground)]">当前余额</span>
          <span className="font-medium">
            {formatUnits(balance, token.decimals)} {token.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-muted-foreground)]">每次可领</span>
          <span className="font-medium">
            {amountStr} {token.symbol}
          </span>
        </div>
        <Button
          className="w-full"
          disabled={hasClaimed || isPending}
          onClick={handleClaim}
        >
          {isPending ? "领取中..." : hasClaimed ? "已领取过" : `领取 ${token.symbol}`}
        </Button>
      </CardContent>
    </Card>
  );
}
