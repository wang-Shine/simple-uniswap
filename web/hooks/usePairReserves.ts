"use client";

import { useReadContract } from "wagmi";
import { SIMPLE_ROUTER_ABI } from "@/lib/abi";

/**
 * 读 (tokenA, tokenB) 对应的 reserves。router 内部会 sortTokens + 找 pair。
 * 返回的 reserveA 对应传入的 tokenA(路由已经做了 sort 归一化)。
 */
export function usePairReserves(
  router?: `0x${string}`,
  tokenA?: `0x${string}`,
  tokenB?: `0x${string}`,
) {
  const zero = "0x0000000000000000000000000000000000000000";
  const enabled = Boolean(
    router &&
      tokenA &&
      tokenB &&
      router !== zero &&
      tokenA !== zero &&
      tokenB !== zero &&
      tokenA.toLowerCase() !== tokenB.toLowerCase(),
  );
  const q = useReadContract({
    address: router,
    abi: SIMPLE_ROUTER_ABI,
    functionName: "getReserves",
    args: tokenA && tokenB ? [tokenA, tokenB] : undefined,
    query: { enabled },
  });
  const [reserveA = 0n, reserveB = 0n] = (q.data as [bigint, bigint] | undefined) ?? [];
  return {
    reserveA,
    reserveB,
    isLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
  };
}
