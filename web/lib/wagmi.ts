import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, foundry } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const localRpc = "http://127.0.0.1:8545";
const sepoliaRpc =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = getDefaultConfig({
  appName: "SimpleDEX",
  projectId,
  chains: [foundry, sepolia],
  transports: {
    [foundry.id]: http(localRpc),
    [sepolia.id]: http(sepoliaRpc),
  },
  ssr: true,
});

// 默认链为 foundry (Anvil 本地链)
export const defaultChain = foundry;
