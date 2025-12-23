"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isFarcasterMiniApp } from "@/lib/utils/farcaster-connector";

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
        // Use centralized utility to detect Farcaster miniapp environment
        const isInMiniApp = isFarcasterMiniApp();
        
        console.log('[Farcaster] Environment detection:', {
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
          
          // CRITICAL: Call ready() when interface is ready to be displayed
          // Per Farcaster Loading Guide: "Call ready when your interface is ready to be displayed"
          // Per Farcaster Loading Guide: "If you're using React, call ready inside a useEffect hook"
          // Per Farcaster Loading Guide: "You should call ready as soon as possible while avoiding jitter and content reflows"
          // This is the PRIMARY caller per React best practices (useEffect)
          // NOTE: ready() may have been called from layout.tsx script tag (early attempt), but we call it here as PRIMARY
          if (sdk && sdk.actions && sdk.actions.ready) {
            // Check if ready() was already called from layout script (early attempt)
            const alreadyCalled = typeof window !== 'undefined' && (window as any).__farcasterReady;
            
            if (!alreadyCalled) {
              console.log('[Farcaster] ⚡⚡⚡ PRIMARY: Calling sdk.actions.ready() (per React useEffect best practices)...');
              try {
                // Call ready() with empty object as per Farcaster docs
                // IMPORTANT: Don't await - call it and let it run in background
                // This ensures ready() is called even if there are errors later
                // Per docs: "Call ready when your interface is ready to be displayed"
                sdk.actions.ready({}).then(() => {
                  console.log('[Farcaster] ✅✅✅ ready() called successfully (PRIMARY - per React docs) - splash screen should dismiss NOW');
                  (window as any).__farcasterReady = true;
                }).catch((readyError: any) => {
                  console.error("[Farcaster] ❌❌❌ Ready call failed (CRITICAL):", {
                    error: readyError?.message || readyError,
                    name: readyError?.name,
                    stack: readyError?.stack
                  });
                  // Mark as ready anyway so app can continue
                  (window as any).__farcasterReady = true;
                });
                // Also set flag immediately to prevent blocking
                (window as any).__farcasterReady = true;
              } catch (syncError: any) {
                console.error("[Farcaster] ❌❌❌ Sync ready() call failed:", syncError);
                // Try async call as fallback
                try {
                  sdk.actions.ready({}).catch((e: any) => {
                    console.error("[Farcaster] Async ready() also failed:", e);
                  });
                } catch (retryError) {
                  console.error("[Farcaster] Cannot call ready():", retryError);
                }
                // Mark as ready anyway so app can continue
                (window as any).__farcasterReady = true;
              }
            } else {
              console.log('[Farcaster] ✅ ready() already called from layout script (early attempt), skipping duplicate call');
            }
          } else {
            console.error("[Farcaster] ❌❌❌ SDK or sdk.actions.ready() not available!");
            console.error("[Farcaster] SDK object:", sdk);
            console.error("[Farcaster] sdk.actions:", sdk?.actions);
            // Mark as ready anyway to prevent infinite splash screen
            // Per Agents Checklist: "Ensure the app calls ready() after initialization"
            (window as any).__farcasterReady = true;
          }
          
          // Get context and user data (non-blocking, can happen after ready())
          // Note: Some Farcaster SDK internal API calls may fail (e.g., /~api/v2/unseen)
          // These errors are harmless and don't affect functionality
          if (sdk) {
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
          }
          
          // Set loaded to true after SDK is initialized
          setIsLoaded(true);
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
