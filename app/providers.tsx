"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { injected } from "wagmi/connectors";

// Memastikan konfigurasi config mendukung SSR dan deteksi wallet yang tepat
const config = createConfig({
  chains: [base],
  connectors: [
    farcasterFrame(), // Letakkan paling atas agar terdeteksi pertama di Warpcast
    injected(),       // Fallback untuk MetaMask/Browser Extension
  ],
  transports: {
    [base.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  // Menggunakan state agar QueryClient tidak dibuat ulang saat re-render
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
