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
          console.log('[Farcaster] Running in miniapp mode - initializing SDK...');
          
          try {
            const { sdk } = await import("@farcaster/miniapp-sdk");
            console.log('[Farcaster] SDK imported successfully');
            
            // CRITICAL: Call ready() IMMEDIATELY to dismiss splash screen
            // This must be called synchronously, not awaited
            console.log('[Farcaster] Calling sdk.actions.ready()...');
            sdk.actions.ready({}).then(() => {
              console.log('[Farcaster] ✅ ready() called successfully - splash screen should dismiss');
            }).catch((err) => {
              console.error("[Farcaster] ❌ Ready call failed:", err);
              // Still set loaded to true so app can continue
              setIsLoaded(true);
            });
            
            // Set loaded immediately after calling ready()
            setIsLoaded(true);
            
            // Then get context and user data (non-blocking)
            try {
              console.log('[Farcaster] Fetching context...');
              const context = await sdk.context;
              console.log('[Farcaster] Context fetched:', context ? 'success' : 'empty');
              
              if (context?.user) {
                const userData = context.user as any;
                console.log('[Farcaster] User data found:', {
                  username: userData.username,
                  fid: userData.fid,
                  hasPfp: !!(userData.pfpUrl || userData.pfp)
                });
                
                const normalizedUser = {
                  ...userData,
                  username: userData.username || "Farcaster User",
                  pfpUrl: userData.pfpUrl || userData.pfp || "" 
                };
                
                setUser(normalizedUser);
              } else {
                console.warn('[Farcaster] No user data in context');
              }
            } catch (contextError: any) {
              console.warn("[Farcaster] Context fetch error (non-critical):", contextError?.message || contextError);
              // Continue even if context fails - ready() already called
            }
          } catch (importError: any) {
            console.error("[Farcaster] SDK import error:", importError?.message || importError);
            setError("Failed to load Farcaster SDK");
            setIsLoaded(true); // Still allow app to load
          }
        } else {
          // Web browser mode - no Farcaster SDK needed
          console.log('[Farcaster] Running in web browser mode');
          setIsLoaded(true);
        }
      } catch (e: any) {
        console.error("[Farcaster] Init Error:", e?.message || e);
        setError("Failed to initialize Farcaster");
        setIsLoaded(true); // Always set loaded to true so app can continue
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
