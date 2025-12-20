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
        // PERBAIKAN UTAMA: Ambil context dari hasil ready()
        // Ini jauh lebih stabil daripada memanggil sdk.context langsung
        const context = (await sdk.actions.ready()) as any;
        
        if (context?.user) {
          // Kita simpan objek user-nya
          // Frame SDK v2 biasanya mengirim: { fid, username, displayName, pfpUrl }
          setUser(context.user);
          console.log("Farcaster User Loaded:", context.user);
        } else {
          console.warn("Farcaster context loaded but no user found");
        }
      } catch (e) {
        setError("Failed to connect to Farcaster");
        console.error("Farcaster SDK Init Error:", e);
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
