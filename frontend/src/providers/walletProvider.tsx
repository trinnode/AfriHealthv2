
// import '@rainbow-me/rainbowkit/styles.css';
// import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
// import { WagmiProvider } from 'wagmi';
// import { defineChain } from 'viem';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// const hederaTestnet = defineChain({
//   id: 296,
//   name: 'Hedera Testnet',
//   nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
//   rpcUrls: {
//     default: { http: ['https://testnet.hashio.io/api'] },
//     public: { http: ['https://testnet.hashio.io/api'] },
//   },
//   blockExplorers: {
//     default: { name: 'Hashscan', url: 'https://hashscan.io/testnet' },
//   },
//   testnet: true,
// });

// const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// const config = getDefaultConfig({
//   appName: import.meta.env.VITE_APP_NAME ?? 'Hedera DApp',
//   projectId,
//   chains: [hederaTestnet],
//   ssr: true,
// });

// const queryClient = new QueryClient();

// export function AppProvider({ children }: { children: React.ReactNode }) {
//   return (
//     <WagmiProvider config={config}>
//       <QueryClientProvider client={queryClient}>
//         <RainbowKitProvider>
//           {children}
//         </RainbowKitProvider>
//       </QueryClientProvider>
//     </WagmiProvider>
//   );
// }
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'Hashscan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
};

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

const config = getDefaultConfig({
  appName: import.meta.env.VITE_APP_NAME ?? 'Hedera DApp',
  projectId,
  chains: [hederaTestnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
