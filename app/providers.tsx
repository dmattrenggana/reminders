"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

/**
 * Initialize Farcaster Miniapp Connector
 * Per Wagmi docs: Connectors should be initialized at module level
 * Always include connector - it will handle environment detection internally
 */
let farcasterConnector: ReturnType<typeof farcasterMiniApp> | null = null;
try {
  farcasterConnector = farcasterMiniApp();
  console.log('[Wagmi Config] ✅ Farcaster miniapp connector initialized');
} catch (error: any) {
  // Log error but don't fail - connector may work at runtime
  console.warn('[Wagmi Config] ⚠️ Farcaster connector init warning (may work at runtime):', error?.message || error);
  // Still try to create connector - it might work in miniapp environment
  try {
    farcasterConnector = farcasterMiniApp();
  } catch (retryError) {
    console.error('[Wagmi Config] ❌ Farcaster connector failed after retry');
  }
}

/**
 * Wagmi Configuration
 * Per Wagmi docs: https://wagmi.sh/react/getting-started#manual-installation
 * - chains: Array of supported chains
 * - connectors: Array of wallet connectors
 * - transports: RPC transport configuration per chain
 */
export const config = createConfig({
  chains: [base],
  // Disable multi-injected provider discovery to prevent CSP errors in Warpcast
  multiInjectedProviderDiscovery: false,
  connectors: [
    // Always include Farcaster connector - it handles environment detection
    // If not in miniapp, it will gracefully fail and fallback to injected
    ...(farcasterConnector ? [farcasterConnector] : []),
    // Injected connector for web browser (MetaMask, etc)
    injected(),
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
});

// Log connector info after config creation (client-side only)
if (typeof window !== 'undefined') {
  console.log('[Wagmi Config] 📋 Connectors configured:', config.connectors.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    ready: c.ready
  })));
}

/**
 * TanStack Query Client
 * Per Wagmi docs: QueryClient should be created at module level
 * Configured with default options for better performance
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce unnecessary refetches
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
