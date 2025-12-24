"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isFarcasterMiniApp } from "@/lib/utils/farcaster-connector";
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
import "@neynar/react/dist/style.css";

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

// Inner provider yang menggabungkan Mini App SDK + SIWN
function FarcasterProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  // Dapatkan user dari SIWN (untuk browser biasa)
  const { user: siwnUser } = useNeynarContext();

  useEffect(() => {
    const init = async () => {
      try {
        const isInMiniApp = isFarcasterMiniApp();
        
        console.log('[Farcaster] Environment detection:', {
          isInMiniApp,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          hasFarcasterGlobal: typeof window !== 'undefined' ? 'Farcaster' in window : false,
          hasFarcasterWindow: typeof window !== 'undefined' ? !!(window as any).Farcaster : false
        });
        
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          // === MINI APP MODE ===
          console.log('[Farcaster] 🚀 Running in miniapp mode - initializing SDK...');
          
          let sdk: any = null;
          
          try {
            console.log('[Farcaster] 📦 Importing SDK...');
            const sdkModule = await import("@farcaster/miniapp-sdk");
            sdk = sdkModule.sdk;
            console.log('[Farcaster] ✅ SDK imported successfully');
            
            (window as any).__farcasterSDK = sdk;
          } catch (importError: any) {
            console.error("[Farcaster] ❌ SDK import failed:", importError?.message || importError);
            sdk = (window as any).__farcasterSDK || (window as any).Farcaster?.sdk;
            if (!sdk) {
              setIsLoaded(true);
              return;
            }
          }
          
          // Call ready()
          if (sdk && sdk.actions && sdk.actions.ready) {
            const alreadyCalled = typeof window !== 'undefined' && (window as any).__farcasterReady;
            
            if (!alreadyCalled) {
              try {
                sdk.actions.ready({});
                (window as any).__farcasterReady = true;
                console.log('[Farcaster] ✅ ready() called successfully');
              } catch (error: any) {
                console.error("[Farcaster] ❌ ready() call FAILED:", error);
                (window as any).__farcasterReady = true;
              }
            }
          }
          
          // Get context and user data
          if (sdk) {
            try {
              const context = await sdk.context;
              
              if (context?.user) {
                const userData = context.user as any;
                const fid = userData.fid;
                
                let enhancedUserData = userData;
                if (fid) {
                  try {
                    const neynarResponse = await fetch(`/api/farcaster/user?fid=${fid}`);
                    if (neynarResponse.ok) {
                      const neynarData = await neynarResponse.json();
                      if (neynarData.user) {
                        enhancedUserData = {
                          ...userData,
                          username: neynarData.user.username || userData.username,
                          pfpUrl: neynarData.user.pfp_url || userData.pfpUrl || userData.pfp,
                          pfp_url: neynarData.user.pfp_url || userData.pfpUrl || userData.pfp,
                          displayName: neynarData.user.display_name || userData.displayName,
                          display_name: neynarData.user.display_name || userData.displayName,
                        };
                      }
                    }
                  } catch (neynarError: any) {
                    console.warn('[Farcaster] Neynar fetch failed (non-critical):', neynarError?.message);
                  }
                }
                
                const normalizedUser = {
                  ...enhancedUserData,
                  username: enhancedUserData.username || "Farcaster User",
                  pfpUrl: enhancedUserData.pfpUrl || enhancedUserData.pfp || "",
                  pfp_url: enhancedUserData.pfpUrl || enhancedUserData.pfp || "",
                };
                
                setUser(normalizedUser);
              }
            } catch (contextError: any) {
              console.warn("[Farcaster] Context fetch error:", contextError?.message);
            }
          }
          
          setIsLoaded(true);
        } else {
          // === WEB BROWSER MODE ===
          console.log('[Farcaster] Running in web browser mode');
          setIsLoaded(true);
        }
      } catch (e: any) {
        console.error("[Farcaster] Init Error:", e?.message || e);
        setError("Failed to initialize Farcaster");
        setIsLoaded(true);
      }
    };

    init();
  }, []);

  // Gabungkan user dari Mini App SDK atau SIWN
  // Prioritas: Mini App user > SIWN user
  const currentUser = user || (siwnUser ? {
    ...siwnUser,
    pfpUrl: siwnUser.pfp_url,
    displayName: siwnUser.display_name,
  } : null);

  return (
    <FarcasterContext.Provider value={{ 
      user: currentUser, 
      isLoaded, 
      error, 
      isMiniApp 
    }}>
      {children}
    </FarcasterContext.Provider>
  );
}

// Main provider yang wrap dengan NeynarContextProvider
export function FarcasterProvider({ children }: { children: ReactNode }) {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Light,
        eventsCallbacks: {
          onAuthSuccess: () => {
            console.log('[SIWN] Auth success');
          },
          onSignout: () => {
            console.log('[SIWN] Signed out');
          },
        },
      }}
    >
      <FarcasterProviderInner>{children}</FarcasterProviderInner>
    </NeynarContextProvider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
