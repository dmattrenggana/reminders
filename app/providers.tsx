"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected } from "wagmi/connectors";

const config = createConfig({
  chains: [base],
  // PERBAIKAN: Matikan penemuan provider otomatis untuk menghindari error CSP di Warpcast
  multiInjectedProviderDiscovery: false, 
  connectors: [
    farcasterFrame(), // Prioritas utama untuk Farcaster Miniapp
    injected(),       // Fallback untuk MetaMask di Browser
  ],
  transports: {
    [base.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
