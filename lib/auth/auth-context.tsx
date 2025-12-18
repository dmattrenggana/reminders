"use client";

import { useEffect, useRef } from "react";
import sdk from "@farcaster/frame-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { AuthProvider } from "@/lib/auth/auth-context";

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      const init = async () => {
        try {
          await sdk.actions.ready();
        } catch (error) {
          console.error("SDK initialization failed:", error);
        }
      };
      
      init();
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
