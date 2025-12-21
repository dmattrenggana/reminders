"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

// 1. Deteksi lingkungan Frame yang lebih akurat
const isFrame = () => {
  if (typeof window === "undefined") return false;
  // Cek apakah ada di dalam iframe atau memiliki tanda userAgent Farcaster
  return window.parent !== window || /farcaster/i.test(navigator.userAgent);
};

// 2. Konfigurasi Wagmi Hybrid yang Dioptimalkan
export const config = createConfig({
  chains: [base],
  // Sangat penting: matikan Discovery di mobile agar tidak memicu deteksi wallet eksternal yang gagal
  multiInjectedProviderDiscovery: false, 
  connectors: [
    // Letakkan farcasterFrame di urutan pertama agar diprioritaskan oleh Mini App
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
          accentColor: "#4f46e5", // Sesuaikan dengan brand indigo Anda
          showWalletLoginFirst: false, 
        },
        // Sembunyikan login Privy jika di dalam Frame agar tidak bentrok dengan SDK
        loginMethods: isFrame() ? [] : ['email', 'wallet', 'google'],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
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
