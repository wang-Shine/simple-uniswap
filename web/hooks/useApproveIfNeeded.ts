"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { maxUint256 } from "viem";
import { TEST_TOKEN_ABI } from "@/lib/abi";
import { useAllowance } from "./useAllowance";
import { useTx } from "./useTx";

/**
 * 若 allowance 不够,先 approve max,再往下走。够了直接跳过。
 * 返回 ensureApproval(amount): Promise<void>
 *   业务方在 handleSubmit 里 await 一下即可。
 */
export function useApproveIfNeeded(token?: `0x${string}`, spender?: `0x${string}`, symbol = "Token") {
  const { address } = useAccount();
  const { allowance, refetch } = useAllowance(token, spender);
  const { sendAsync, isPending } = useTx();

  const ensureApproval = React.useCallback(
    async (amount: bigint) => {
      if (!token || !spender || !address) throw new Error("wallet or tokens missing");
      if (allowance >= amount) return;
      await sendAsync({
        address: token,
        abi: TEST_TOKEN_ABI,
        functionName: "approve",
        args: [spender, maxUint256],
        label: `Approve ${symbol}`,
      });
      await refetch();
    },
    [address, token, spender, allowance, sendAsync, refetch, symbol],
  );

  return { ensureApproval, allowance, isApproving: isPending };
}
