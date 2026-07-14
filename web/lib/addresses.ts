export type Deployment = {
  factory: `0x${string}`;
  router: `0x${string}`;
  pair: `0x${string}`;
  tka: `0x${string}`;
  tkb: `0x${string}`;
};

const ZERO: Deployment = {
  factory: "0x0000000000000000000000000000000000000000",
  router: "0x0000000000000000000000000000000000000000",
  pair: "0x0000000000000000000000000000000000000000",
  tka: "0x0000000000000000000000000000000000000000",
  tkb: "0x0000000000000000000000000000000000000000",
};

// 跑完 `forge script script/Deploy.s.sol --broadcast ...` 后,
// 把打印出的地址填到下面对应的链里
const DEPLOYMENTS: Record<number, Deployment> = {
  11155111: ZERO, // Sepolia
  1: ZERO, // Mainnet(学习项目未真实部署,仅占位)
};

/** 拿指定链的地址集,没部署过就返回全零 */
export function getDeployment(chainId: number | undefined): Deployment | null {
  if (!chainId) return null;
  return DEPLOYMENTS[chainId] ?? null;
}

/** 判断某个 deployment 是否已经真实部署过(非零地址) */
export function isDeployed(d: Deployment | null): boolean {
  if (!d) return false;
  return d.factory !== ZERO.factory;
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
