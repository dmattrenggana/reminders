"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors"; // Tambahkan coinbaseWallet
import { useState, useEffect } from "react";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

export const config = createConfig({
  chains: [base],
  multiInjectedProviderDiscovery: false, 
  connectors: [
    farcasterFrame(), 
    injected(),
    coinbaseWallet({ appName: "Reminders", preference: "smartWalletOnly" }), // Penting untuk user Base
  ],
  transports: {
    // Gunakan RPC publik yang lebih stabil untuk menghindari kegagalan fetch data
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
          {/* PENTING: Jangan gunakan div kosong jika belum mounted. 
            Gunakan null agar tidak ada elemen DOM yang mengganggu inisialisasi SDK.
          */}
          {mounted ? children : null}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
