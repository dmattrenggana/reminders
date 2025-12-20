"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { useState, useEffect } from "react";

// Periksa apakah aplikasi dibuka di dalam Frame
const isFrame = () => {
  if (typeof window === "undefined") return false;
  return window.parent !== window || navigator.userAgent.includes("Farcaster");
};

// 1. Konfigurasi Wagmi Hybrid
export const config = createConfig({
  chains: [base],
  // Matikan Discovery hanya jika di dalam Frame untuk mencegah error CSP Warpcast
  multiInjectedProviderDiscovery: typeof window !== "undefined" ? !isFrame() : false,
  connectors: typeof window !== "undefined" && isFrame() 
    ? [farcasterFrame()] 
    : [injected(), coinbaseWallet()],
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
      appId="clzshclp807eay6ofun669cl5" // App ID Anda tetap sama
      config={{
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          showWalletLoginFirst: false, // Penting agar tidak memicu fetch icon eksternal di Frame
        },
        // Konfigurasi agar tidak bentrok dengan Frame
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
