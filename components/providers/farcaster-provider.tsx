"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import sdk from "@farcaster/frame-sdk";

interface FarcasterContextType {
  user: any;
  isLoaded: boolean;
  error: string | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isLoaded: false,
  error: null,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Memberitahu Farcaster bahwa Frame sudah siap ditampilkan
        const context = await sdk.context;
        setUser(context?.user ?? null);
        sdk.actions.ready();
      } catch (e) {
        setError("Failed to connect to Farcaster");
        console.error(e);
      } finally {
        setIsLoaded(true);
      }
    };

    init();
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isLoaded, error }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
