"use client";

import { useAccount, useReadContract } from "wagmi";
import { TEST_TOKEN_ABI } from "@/lib/abi";

export function useAllowance(token?: `0x${string}`, spender?: `0x${string}`) {
  const { address } = useAccount();
  const enabled = Boolean(
    token &&
      address &&
      spender &&
      token !== "0x0000000000000000000000000000000000000000" &&
      spender !== "0x0000000000000000000000000000000000000000",
  );
  const q = useReadContract({
    address: token,
    abi: TEST_TOKEN_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: { enabled },
  });
  return {
    allowance: (q.data as bigint | undefined) ?? 0n,
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
