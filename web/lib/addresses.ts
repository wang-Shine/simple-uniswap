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
const SEPOLIA_DEPLOYMENT: Deployment = {
  factory: "0x7CdE4AA7323b9485001dB5F77156594104D311e5", // SimpleFactory: 创建/记录交易对
  router: "0xCEab90568D891B1a95F7C59BAe2A52276EE269E7", // SimpleRouter: 加/移除流动性、swap 的入口
  pair: "0x2ACF9be214595FF6c2c3F45aF1e0D3e72eE9191B", // SimplePair(TKA/TKB): 资金池,持有储备
  tka: "0x412dd15f0086d81099B98AbB271a9A2476950345", // TestToken A
  tkb: "0xBA79Cf8320ef9775eD66Cd784b626b9C87099A14", // TestToken B
};

const DEPLOYMENTS: Record<number, Deployment> = {
  11155111: SEPOLIA_DEPLOYMENT, // Sepolia
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
