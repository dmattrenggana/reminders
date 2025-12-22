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
            
            // Get context and user data first (non-blocking)
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
            }
            
            // Set loaded to true after SDK is initialized
            // ready() will be called in separate useEffect after interface is ready
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

  // Call ready() after interface is loaded (per Farcaster docs)
  // Per documentation: "After your app is fully loaded and ready to display"
  // "After your app loads, you must call sdk.actions.ready() to hide the splash screen"
  // This useEffect runs after children are rendered, ensuring interface is ready
  useEffect(() => {
    if (isMiniApp && isLoaded && typeof window !== 'undefined' && (window as any).__farcasterSDK) {
      const sdk = (window as any).__farcasterSDK;
      
      // Per Farcaster docs: "After your app is fully loaded and ready to display"
      // We use requestAnimationFrame to ensure DOM is fully rendered
      // This is better than setTimeout as it waits for browser paint cycle
      const callReady = async () => {
        try {
          console.log('[Farcaster] Calling sdk.actions.ready() - app is fully loaded and ready to display');
          // Per docs: "await sdk.actions.ready()"
          await sdk.actions.ready({});
          console.log('[Farcaster] ✅ ready() called successfully - splash screen should dismiss');
        } catch (err: any) {
          console.error("[Farcaster] ❌ Ready call failed:", err);
        }
      };
      
      // Use requestAnimationFrame to ensure DOM is painted before calling ready()
      // This avoids jitter and content reflows per Farcaster docs
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Double RAF ensures we're after the next paint
          callReady();
        });
      });
    }
  }, [isMiniApp, isLoaded]); // Only run when miniapp is detected and SDK is loaded

  return (
    <FarcasterContext.Provider value={{ user, isLoaded, error, isMiniApp }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
