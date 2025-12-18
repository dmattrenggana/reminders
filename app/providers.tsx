"use client";

import { useEffect, useState, useRef } from "react";
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
  const isInitialized = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        console.log("Farcaster SDK Context Loaded:", frameContext);
        
        // Hide Farcaster splash screen and show the app
        sdk.actions.ready();
      } catch (error) {
        console.error("Failed to load Farcaster SDK:", error);
      }
    };

    if (!isInitialized.current) {
      isInitialized.current = true;
      load();
      setIsSDKLoaded(true);
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
