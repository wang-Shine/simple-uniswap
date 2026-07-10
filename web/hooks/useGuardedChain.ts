"use client";

import { useAccount, useChainId } from "wagmi";
import { getDeployment, isDeployed, type Deployment } from "@/lib/addresses";

/**
 * 交易页统一守卫。返回:
 * - address: 当前账户 (可能 undefined)
 * - chainId, deployment
 * - ready: address 已连接 && 当前链有部署地址
 * - reason: 未 ready 时给一句提示文字
 */
export function useGuardedChain(): {
  address?: `0x${string}`;
  chainId?: number;
  deployment: Deployment | null;
  ready: boolean;
  reason?: string;
} {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const deployment = getDeployment(chainId);
  const deployed = isDeployed(deployment);

  let ready = true;
  let reason: string | undefined;
  if (!isConnected || !address) {
    ready = false;
    reason = "请先连接钱包";
  } else if (!deployment) {
    ready = false;
    reason = `未支持 chain ${chainId ?? "?"},请切到 foundry(31337) 或 sepolia`;
  } else if (!deployed) {
    ready = false;
    reason = `chain ${chainId} 上还没部署,先跑 forge script`;
  }

  return { address, chainId, deployment, ready, reason };
}
