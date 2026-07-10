import localDeployment from "./deployments/31337.json";
import sepoliaDeployment from "./deployments/11155111.json";

export type Deployment = {
  chainId: number;
  deployer: `0x${string}`;
  factory: `0x${string}`;
  router: `0x${string}`;
  pair: `0x${string}`;
  tka: `0x${string}`;
  tkb: `0x${string}`;
};

const DEPLOYMENTS: Record<number, Deployment> = {
  31337: localDeployment as Deployment,
  11155111: sepoliaDeployment as Deployment,
};

/** 拿指定链的地址集,没部署过就返回全零 */
export function getDeployment(chainId: number | undefined): Deployment | null {
  if (!chainId) return null;
  const d = DEPLOYMENTS[chainId];
  if (!d) return null;
  // 未部署时 factory 是零地址,前端应该拦截 UI
  if (d.factory === "0x0000000000000000000000000000000000000000") return d;
  return d;
}

/** 判断某个 deployment 是否已经真实部署过(非零地址) */
export function isDeployed(d: Deployment | null): boolean {
  if (!d) return false;
  return d.factory !== "0x0000000000000000000000000000000000000000";
}

/** 已部署的 TestToken 列表(供 faucet 页和下拉列表用) */
export type TokenInfo = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
};

export function getTokens(d: Deployment | null): TokenInfo[] {
  if (!d || !isDeployed(d)) return [];
  return [
    { address: d.tka, symbol: "TKA", name: "Token A", decimals: 18 },
    { address: d.tkb, symbol: "TKB", name: "Token B", decimals: 18 },
  ];
}
