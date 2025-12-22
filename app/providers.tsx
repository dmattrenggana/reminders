"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

export const config = createConfig({
  chains: [base],
  // MATIKAN discovery otomatis agar tidak memicu error CSP di Warpcast
  multiInjectedProviderDiscovery: false, 
  connectors: [
    farcasterMiniApp() as any, // Miniapp connector untuk Farcaster client
    injected(), // Injected untuk web browser (MetaMask, etc)
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), 
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          {mounted ? children : null}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
