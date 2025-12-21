"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

const isFrame = () => {
  if (typeof window === "undefined") return false;
  return window.parent !== window || /farcaster/i.test(navigator.userAgent);
};

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

  if (!mounted) return null;

  return (
    <PrivyProvider
      appId="clzshclp807eay6ofun669cl5"
      config={{
        appearance: {
          theme: "light",
          accentColor: "#4f46e5",
          showWalletLoginFirst: false, 
        },
        // Sesuai saran sebelumnya, kosongkan login methods jika di dalam frame
        loginMethods: isFrame() ? [] : ['email', 'wallet', 'google'],
        embeddedWallets: {
          // PERBAIKAN DI SINI: Bungkus di dalam objek 'ethereum'
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <FarcasterProvider>
            {children}
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
