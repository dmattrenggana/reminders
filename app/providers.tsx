"use client";

import { useEffect, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const load = async () => {
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        console.log("Farcaster SDK Context:", frameContext);
        
        // Menghilangkan splash screen logo Farcaster
        sdk.actions.ready();
      } catch (error) {
        console.error("Failed to load Farcaster SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      load();
      setIsSDKLoaded(true);
    }
  }, [isSDKLoaded]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
