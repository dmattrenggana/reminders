"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

export const config = createConfig({
  chains: [base],
  multiInjectedProviderDiscovery: true, // Nyalakan untuk Desktop agar MetaMask terdeteksi
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

  return (
    <PrivyProvider
      appId="clzshclp807eay6ofun669cl5"
      config={{
        appearance: {
          theme: "light",
          accentColor: "#4f46e5",
        },
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
            {/* Render children langsung, mounted check dilakukan di level komponen */}
            {children}
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
