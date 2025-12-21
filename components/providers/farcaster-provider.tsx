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
        // Ambil context dan jalankan ready() sekaligus
        const context = await sdk.context;
        
        if (context?.user) {
          const normalizedUser = {
            ...context.user,
            username: context.user.username || "Farcaster User",
            pfpUrl: context.user.pfpUrl || context.user.pfp || "" 
          };
          setUser(normalizedUser);
        }
        
        await sdk.actions.ready({});
      } catch (e) {
        setError("Failed to connect to Farcaster");
        console.error("SDK Init Error:", e);
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
