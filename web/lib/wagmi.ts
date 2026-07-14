import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";

const sepoliaRpc =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
const mainnetRpc = process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://eth.llamarpc.com";

export const wagmiConfig = getDefaultConfig({
  appName: "SimpleDEX",
  projectId,
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(sepoliaRpc),
    [mainnet.id]: http(mainnetRpc),
  },
  ssr: true,
});

// 默认链为 sepolia (测试网)
export const defaultChain = sepolia;
