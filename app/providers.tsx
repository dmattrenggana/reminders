"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

// Konfigurasi Wagmi yang dioptimalkan untuk Frame v2
export const config = createConfig({
  chains: [base],
  // Matikan discovery otomatis untuk mencegah error CSP (WalletConnect)
  multiInjectedProviderDiscovery: false, 
  connectors: [
    farcasterFrame(), // Prioritas utama untuk Warpcast Mobile
    injected(),       // Fallback untuk Browser Desktop (MetaMask, dll)
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Mencegah Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          {/* Gunakan pengecekan mounted agar sinkronisasi antara 
            Wagmi dan DOM browser berjalan sempurna tanpa flash 
          */}
          {mounted ? children : <div className="min-h-screen bg-white" />}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
