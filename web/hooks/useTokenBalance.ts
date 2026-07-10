"use client";

import { useAccount, useReadContract } from "wagmi";
import { TEST_TOKEN_ABI } from "@/lib/abi";

/**
 * 读取 ERC20 余额。地址为 zero / 空,自动 disable。
 * 用 blockNumber 触发时不 refetch,靠 react-query 的 stale 时间。
 * 需要在写交易后手动 refetch,返回 refetch。
 */
export function useTokenBalance(token?: `0x${string}`, account?: `0x${string}`) {
  const { address: connected } = useAccount();
  const who = account ?? connected;
  const enabled = Boolean(token && who && token !== "0x0000000000000000000000000000000000000000");
  const q = useReadContract({
    address: token,
    abi: TEST_TOKEN_ABI,
    functionName: "balanceOf",
    args: who ? [who] : undefined,
    query: { enabled },
  });
  return {
    balance: (q.data as bigint | undefined) ?? 0n,
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
