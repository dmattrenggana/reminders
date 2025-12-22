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
        // Multiple checks to ensure we detect miniapp correctly
        const hasFarcasterGlobal = typeof window !== 'undefined' && 'Farcaster' in window;
        const hasFarcasterWindow = typeof window !== 'undefined' && (window as any).Farcaster;
        
        const isInMiniApp = hasFarcasterGlobal || hasFarcasterWindow;
        
        console.log('[Farcaster] Environment detection:', {
          hasFarcasterGlobal,
          hasFarcasterWindow,
          isInMiniApp,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
        });
        
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          // Only load SDK if in miniapp environment
          console.log('[Farcaster] Running in miniapp mode - initializing SDK...');
          
          let sdk: any = null;
          
          try {
            const sdkModule = await import("@farcaster/miniapp-sdk");
            sdk = sdkModule.sdk;
            console.log('[Farcaster] SDK imported successfully');
            
            // Store SDK instance for later use
            (window as any).__farcasterSDK = sdk;
          } catch (importError: any) {
            console.error("[Farcaster] ❌ SDK import failed:", importError?.message || importError);
            // Try to get SDK from window if it exists
            sdk = (window as any).__farcasterSDK || (window as any).Farcaster?.sdk;
            if (sdk) {
              console.log('[Farcaster] ✅ Found SDK from window object');
            } else {
              console.error("[Farcaster] ❌ SDK not available - cannot call ready()");
              setIsLoaded(true);
              return; // Exit early if SDK not available
            }
          }
          
          // CRITICAL: Call ready() IMMEDIATELY after SDK is available to dismiss splash screen
          // Per Farcaster docs: "After your app loads, you must call sdk.actions.ready() to hide the splash screen"
          // This MUST be called or splash screen will persist
          if (sdk && sdk.actions && sdk.actions.ready) {
            console.log('[Farcaster] ⚡⚡⚡ CRITICAL: Calling sdk.actions.ready() IMMEDIATELY to dismiss splash screen...');
            try {
              // Call ready() with empty object as per Farcaster docs
              await sdk.actions.ready({});
              console.log('[Farcaster] ✅✅✅✅✅ ready() called successfully - splash screen should dismiss NOW');
              (window as any).__farcasterReady = true;
            } catch (readyError: any) {
              console.error("[Farcaster] ❌❌❌ Ready call failed (CRITICAL):", {
                error: readyError?.message || readyError,
                name: readyError?.name,
                stack: readyError?.stack
              });
              // Try to call ready() again without await (non-blocking)
              try {
                sdk.actions.ready({}).catch((e: any) => {
                  console.error("[Farcaster] Retry ready() also failed:", e);
                });
              } catch (retryError) {
                console.error("[Farcaster] Cannot retry ready():", retryError);
              }
              // Mark as ready anyway so app can continue
              (window as any).__farcasterReady = true;
            }
          } else {
            console.error("[Farcaster] ❌❌❌ SDK or sdk.actions.ready() not available!");
            console.error("[Farcaster] SDK object:", sdk);
            console.error("[Farcaster] sdk.actions:", sdk?.actions);
            // Mark as ready anyway to prevent infinite splash screen
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
