"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

// Initialize connectors with better error handling
let farcasterConnector: any;
try {
  farcasterConnector = farcasterMiniApp();
  console.log('[Wagmi Config] ✅ Farcaster miniapp connector initialized');
} catch (error: any) {
  console.error('[Wagmi Config] ❌ Failed to initialize Farcaster connector:', error);
  farcasterConnector = null;
}

export const config = createConfig({
  chains: [base],
  // MATIKAN discovery otomatis agar tidak memicu error CSP di Warpcast
  multiInjectedProviderDiscovery: false, 
  connectors: [
    ...(farcasterConnector ? [farcasterConnector] : []), // Only add if successfully initialized
    injected(), // Injected untuk web browser (MetaMask, etc)
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"), 
  },
});

// Log connector info after config creation
if (typeof window !== 'undefined') {
  console.log('[Wagmi Config] Connectors configured:', config.connectors.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type
  })));
}

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
