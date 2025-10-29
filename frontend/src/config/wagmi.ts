import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Define Hedera Testnet as a custom chain
export const hederaTestnet = defineChain({
  id: 296, // Hedera Testnet Chain ID
  name: "Hedera Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
    public: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: true,
});

// Define Hedera Mainnet as a custom chain
export const hederaMainnet = defineChain({
  id: 295, // Hedera Mainnet Chain ID
  name: "Hedera Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.hashio.io/api"],
    },
    public: {
      http: ["https://mainnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/mainnet",
    },
  },
  testnet: false,
});

// Get the network from environment
const isMainnet = import.meta.env.VITE_HEDERA_NETWORK === "mainnet";
const chains = [isMainnet ? hederaMainnet : hederaTestnet] as const;

// Configure RainbowKit with Hedera
export const config = getDefaultConfig({
  appName: "AfriHealth Ledger",
  projectId:
    import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains,
  ssr: false, // We're not using server-side rendering
});
