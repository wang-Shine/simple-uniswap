"use client";

import * as React from "react";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";
import type { Abi } from "viem";
import { useToast } from "@/components/ui/toast";

/**
 * 统一的写交易 hook。
 * - 显示"提交中/上链中/成功/失败" toast
 * - 成功时给一条 explorer 链接
 * - 返回 sendAsync,允许链式调用: await sendAsync(x); await sendAsync(y);
 *
 * 用法:
 *   const { sendAsync, isPending } = useTx();
 *   await sendAsync({ address, abi, functionName, args, label: "Approve TKA" });
 */
export function useTx() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { push } = useToast();
  const [isPending, setIsPending] = React.useState(false);

  const explorer = React.useCallback(
    (hash: `0x${string}`) => {
      if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
      return undefined;
    },
    [chainId],
  );

  const sendAsync = React.useCallback(
    async (opts: {
      address: `0x${string}`;
      abi: Abi | readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
      label: string;
    }) => {
      setIsPending(true);
      try {
        const hash = await writeContractAsync({
          address: opts.address,
          abi: opts.abi as Abi,
          functionName: opts.functionName,
          args: opts.args as readonly unknown[] | undefined,
        });
        const link = explorer(hash);
        push({
          title: `${opts.label} 已提交`,
          description: hash,
          variant: "default",
          ...(link ? { action: { label: "查看", href: link } } : {}),
        });
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === "success") {
            push({
              title: `${opts.label} 成功`,
              variant: "success",
              ...(link ? { action: { label: "查看", href: link } } : {}),
            });
          } else {
            push({ title: `${opts.label} 失败`, description: hash, variant: "error" });
            throw new Error(`${opts.label} reverted`);
          }
        }
        return hash;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        // 用户拒绝签名的情况不弹错误
        if (!/User rejected|User denied/i.test(msg)) {
          push({ title: `${opts.label} 失败`, description: msg.slice(0, 200), variant: "error" });
        }
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, publicClient, push, explorer],
  );

  return { sendAsync, isPending };
}
