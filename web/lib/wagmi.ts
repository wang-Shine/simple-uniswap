import { http } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 在 https://cloud.reown.com 创建项目获取 projectId
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";

// 支持的链,顺序影响 AppKit 里的默认展示
export const networks = [sepolia, mainnet] as const;

const sepoliaRpc =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
const mainnetRpc = process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://eth.llamarpc.com";

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks: [...networks],
  projectId,
  transports: {
    [sepolia.id]: http(sepoliaRpc),
    [mainnet.id]: http(mainnetRpc),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// 默认链为 sepolia (测试网)
export const defaultChain = sepolia;
