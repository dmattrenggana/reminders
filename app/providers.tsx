"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

// Konfigurasi Wagmi di luar komponen untuk mencegah re-render
export const config = createConfig({
  chains: [base],
  multiInjectedProviderDiscovery: false,
  connectors: [
    farcasterFrame(),
    injected(),
    coinbaseWallet(),
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Jangan return null jika belum mounted agar SDK Farcaster bisa mulai inisialisasi lebih awal
  // Cukup gunakan pengecekan mounted di dalam komponen yang butuh akses browser API

  return (
    <PrivyProvider
      appId="clzshclp807eay6ofun669cl5"
      config={{
        appearance: {
          theme: "light",
          accentColor: "#4f46e5",
          showWalletLoginFirst: false, 
        },
        // Jangan dikosongkan agar Privy tidak stuck, biarkan default
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <FarcasterProvider>
            {mounted ? children : <div className="min-h-screen bg-white" />}
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
