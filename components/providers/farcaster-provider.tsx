"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface FarcasterContextType {
  user: any;
  isLoaded: boolean;
  error: string | null;
  isMiniApp: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isLoaded: false,
  error: null,
  isMiniApp: false,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if running in Farcaster miniapp environment
        const isInMiniApp = typeof window !== 'undefined' && 'Farcaster' in window;
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          // Only load SDK if in miniapp environment
          console.log('[Farcaster] Running in miniapp mode');
          
          const { sdk } = await import("@farcaster/miniapp-sdk");
          
          // CRITICAL: Call ready() FIRST to dismiss splash screen
          // Don't await it - it should be called immediately
          sdk.actions.ready({}).catch((err) => {
            console.warn("[Farcaster] Ready call warning:", err);
          });
          
          // Then get context and user data
          try {
            const context = await sdk.context;
            
            if (context?.user) {
              const userData = context.user as any;
              
              const normalizedUser = {
                ...userData,
                username: userData.username || "Farcaster User",
                pfpUrl: userData.pfpUrl || userData.pfp || "" 
              };
              
              setUser(normalizedUser);
            }
          } catch (contextError) {
            console.warn("[Farcaster] Context fetch error (non-critical):", contextError);
            // Continue even if context fails - ready() already called
          }
        } else {
          // Web browser mode - no Farcaster SDK needed
          console.log('[Farcaster] Running in web browser mode');
        }
      } catch (e) {
        console.error("[Farcaster] SDK Init Error:", e);
        setError("Not running in Farcaster client");
      } finally {
        setIsLoaded(true);
      }
    };

    init();
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isLoaded, error, isMiniApp }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
