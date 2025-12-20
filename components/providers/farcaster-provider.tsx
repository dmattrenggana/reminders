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
        // Ambil context dari ready()
        const context = (await sdk.actions.ready()) as any;
        
        if (context?.user) {
          // NORMALISASI: Memastikan UI selalu mendapatkan pfpUrl dan username 
          // apa pun nama variabel asli dari SDK
          const normalizedUser = {
            ...context.user,
            username: context.user.username || context.user.displayName || "Farcaster User",
            pfpUrl: context.user.pfpUrl || context.user.pfp || "" 
          };
          
          setUser(normalizedUser);
          console.log("Farcaster User Verified:", normalizedUser);
        }
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
