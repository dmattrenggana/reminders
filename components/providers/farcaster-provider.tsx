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
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          hasFarcasterGlobal: typeof window !== 'undefined' ? 'Farcaster' in window : false,
          hasFarcasterWindow: typeof window !== 'undefined' ? !!(window as any).Farcaster : false
        });
        
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          // Only load SDK if in miniapp environment
          console.log('[Farcaster] 🚀 Running in miniapp mode - initializing SDK...');
          console.log('[Farcaster] Window.Farcaster:', typeof window !== 'undefined' ? !!(window as any).Farcaster : 'N/A');
          
          let sdk: any = null;
          
          try {
            console.log('[Farcaster] 📦 Importing SDK...');
            const sdkModule = await import("@farcaster/miniapp-sdk");
            sdk = sdkModule.sdk;
            console.log('[Farcaster] ✅ SDK imported successfully', {
              hasSdk: !!sdk,
              hasActions: !!(sdk?.actions),
              hasReady: !!(sdk?.actions?.ready),
              sdkType: typeof sdk,
              actionsType: typeof sdk?.actions,
              readyType: typeof sdk?.actions?.ready
            });
            
            // Store SDK instance for later use
            (window as any).__farcasterSDK = sdk;
          } catch (importError: any) {
            console.error("[Farcaster] ❌ SDK import failed:", importError?.message || importError);
            console.error("[Farcaster] Import error details:", importError);
            // Try to get SDK from window if it exists
            sdk = (window as any).__farcasterSDK || (window as any).Farcaster?.sdk;
            if (sdk) {
              console.log('[Farcaster] ✅ Found SDK from window object');
            } else {
              console.error("[Farcaster] ❌ SDK not available anywhere - cannot call ready()");
              // Still try to call ready() with window.Farcaster if available
              if (typeof window !== 'undefined' && (window as any).Farcaster) {
                console.log('[Farcaster] 🔄 Attempting to call ready() via window.Farcaster...');
                try {
                  if ((window as any).Farcaster.actions?.ready) {
                    (window as any).Farcaster.actions.ready({});
                    (window as any).__farcasterReady = true;
                    console.log('[Farcaster] ✅ ready() called via window.Farcaster');
                  }
                } catch (e) {
                  console.error('[Farcaster] Failed to call ready() via window.Farcaster:', e);
                }
              }
              setIsLoaded(true);
              return; // Exit early if SDK not available
            }
          }
          
          // CRITICAL: Call ready() IMMEDIATELY after SDK import
          console.log('[Farcaster] 🎯 Preparing to call ready()...');
          console.log('[Farcaster] SDK check:', {
            sdkExists: !!sdk,
            actionsExists: !!(sdk?.actions),
            readyExists: !!(sdk?.actions?.ready),
            alreadyCalled: typeof window !== 'undefined' ? !!(window as any).__farcasterReady : false
          });
          
          if (sdk && sdk.actions && sdk.actions.ready) {
            // Check if ready() was already called from layout script
            const alreadyCalled = typeof window !== 'undefined' && (window as any).__farcasterReady;
            
            if (!alreadyCalled) {
              console.log('[Farcaster] ⚡⚡⚡ CALLING sdk.actions.ready() NOW...');
              console.log('[Farcaster] Timestamp:', Date.now());
              
              try {
                // Call ready() IMMEDIATELY - no delays, no checks
                const readyCall = sdk.actions.ready({});
                console.log('[Farcaster] ready() invoked, result:', readyCall);
                (window as any).__farcasterReady = true;
                console.log('[Farcaster] ✅✅✅ ready() called successfully - splash should dismiss');
              } catch (error: any) {
                console.error("[Farcaster] ❌❌❌ ready() call FAILED:", error);
                console.error("[Farcaster] Error details:", {
                  message: error?.message,
                  name: error?.name,
                  stack: error?.stack
                });
                // Mark as ready anyway so app can continue
                (window as any).__farcasterReady = true;
              }
            } else {
              console.log('[Farcaster] ✅ ready() already called by layout script');
            }
          } else {
            console.error("[Farcaster] ❌❌❌ CRITICAL: SDK or sdk.actions.ready() NOT AVAILABLE!");
            console.error("[Farcaster] SDK details:", {
              sdk: !!sdk,
              sdkType: typeof sdk,
              actions: !!(sdk?.actions),
              actionsType: typeof sdk?.actions,
              ready: !!(sdk?.actions?.ready),
              readyType: typeof sdk?.actions?.ready
            });
            
            // Last resort: try window.Farcaster directly
            if (typeof window !== 'undefined' && (window as any).Farcaster?.actions?.ready) {
              console.log('[Farcaster] 🔄 Last resort: calling via window.Farcaster...');
              try {
                (window as any).Farcaster.actions.ready({});
                (window as any).__farcasterReady = true;
                console.log('[Farcaster] ✅ ready() called via window.Farcaster (last resort)');
              } catch (e) {
                console.error('[Farcaster] Last resort failed:', e);
              }
            }
            
            // Mark as ready anyway to prevent infinite splash screen
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
