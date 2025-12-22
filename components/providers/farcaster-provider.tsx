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
            
            // Store SDK instance for later use
            (window as any).__farcasterSDK = sdk;
            
            // CRITICAL: Call ready() IMMEDIATELY after SDK import to dismiss splash screen
            // Per Farcaster docs: "After your app loads, you must call sdk.actions.ready() to hide the splash screen"
            // We call it immediately to ensure splash screen dismisses as soon as possible
            console.log('[Farcaster] ⚡ CRITICAL: Calling sdk.actions.ready() IMMEDIATELY to dismiss splash screen...');
            try {
              await sdk.actions.ready({});
              console.log('[Farcaster] ✅✅✅ ready() called successfully - splash screen should dismiss NOW');
              (window as any).__farcasterReady = true;
            } catch (readyError: any) {
              console.error("[Farcaster] ❌❌❌ Ready call failed (CRITICAL):", readyError);
              // Even if ready() fails, mark as ready so app can continue
              (window as any).__farcasterReady = true;
            }
            
            // Get context and user data (non-blocking, can happen after ready())
            // Note: Some Farcaster SDK internal API calls may fail (e.g., /~api/v2/unseen)
            // These errors are harmless and don't affect functionality
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
              // Context fetch errors are non-critical - SDK may fail to fetch some internal data
              // (e.g., unseen notifications API) but this doesn't affect core functionality
              console.warn("[Farcaster] Context fetch error (non-critical, SDK internal API may be unavailable):", contextError?.message || contextError);
            }
            
            // Set loaded to true after SDK is initialized
            setIsLoaded(true);
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

  // Note: ready() is now called IMMEDIATELY after SDK import (above)
  // This ensures splash screen dismisses as soon as possible
  // No need for separate useEffect - ready() is called synchronously during SDK initialization

  return (
    <FarcasterContext.Provider value={{ user, isLoaded, error, isMiniApp }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
