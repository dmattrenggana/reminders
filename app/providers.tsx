"use client";

import { useEffect, useRef } from "react";
import sdk from "@farcaster/frame-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi"; 
// 1. IMPORT your  here. 
// Look for where "useAuth" is defined in your project.
// import {  } from "@/context/AuthContext"; 

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      sdk.actions.ready();
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* 2. WRAP the children with  */}
        {/* <> */}
          {children}
        {/* </> */}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
