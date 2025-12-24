"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { detectEnvironment, type EnvironmentType, getEnvironmentName } from "@/lib/utils/farcaster-connector";
import { NeynarContextProvider, Theme, useNeynarContext } from "@neynar/react";
import "@neynar/react/dist/style.css";

interface FarcasterContextType {
  user: any;
  isLoaded: boolean;
  error: string | null;
  isMiniApp: boolean;
  environment: EnvironmentType;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isLoaded: false,
  error: null,
  isMiniApp: false,
  environment: 'browser',
});

// Inner provider yang menggabungkan Mini App SDK + SIWN + BaseApp
function FarcasterProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentType>('browser');

  // Dapatkan user dari SIWN (untuk browser biasa)
  const { user: siwnUser } = useNeynarContext();
  
  // isMiniApp is true for both Farcaster Miniapp and BaseApp (they both use miniapp-like behavior)
  const isMiniApp = environment === 'farcaster-miniapp' || environment === 'base-app';

  useEffect(() => {
    const init = async () => {
      try {
        const detectedEnv = detectEnvironment();
        const envName = getEnvironmentName();
        
        console.log('[Environment] Detection:', {
          environment: detectedEnv,
          environmentName: envName,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          hasFarcasterGlobal: typeof window !== 'undefined' ? 'Farcaster' in window : false,
          hasBaseApp: typeof window !== 'undefined' ? !!(window as any).base || !!(window as any).Base : false,
        });
        
        setEnvironment(detectedEnv);

        if (detectedEnv === 'farcaster-miniapp') {
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
                
                // Always fetch complete user data from Neynar API using FID
                // Neynar API is the authoritative source for Farcaster user data
                if (fid) {
                  try {
                    console.log('[Farcaster] 🔄 Fetching complete user data from Neynar API for FID:', fid);
                    const neynarResponse = await fetch(`/api/farcaster/user?fid=${fid}`);
                    if (neynarResponse.ok) {
                      const neynarData = await neynarResponse.json();
                      if (neynarData.user) {
                        // Use Neynar data as primary source (most complete and accurate)
                        const normalizedUser = {
                          // Identity
                          fid: fid,
                          username: neynarData.user.username,
                          displayName: neynarData.user.display_name,
                          display_name: neynarData.user.display_name,
                          
                          // Profile
                          pfpUrl: neynarData.user.pfp_url,
                          pfp_url: neynarData.user.pfp_url,
                          pfp: neynarData.user.pfp_url,
                          bio: neynarData.user.bio,
                          
                          // Profile data
                          profile: neynarData.user.profile,
                          
                          // Verification
                          verifications: neynarData.user.verifications || [],
                          verifiedAddresses: neynarData.user.verifications || [],
                          verified_addresses: neynarData.user.verified_addresses,
                          verified_accounts: neynarData.user.verified_accounts,
                          
                          // Addresses
                          custody_address: neynarData.user.custody_address,
                          
                          // Social stats
                          follower_count: neynarData.user.follower_count,
                          following_count: neynarData.user.following_count,
                          
                          // Badge
                          power_badge: neynarData.user.power_badge,
                        };
                        
                        console.log('[Farcaster] ✅ User data fetched from Neynar API:', {
                          fid,
                          username: normalizedUser.username,
                          displayName: normalizedUser.displayName,
                          hasPfp: !!normalizedUser.pfpUrl,
                          verifiedAddresses: normalizedUser.verifications?.length || 0,
                          powerBadge: normalizedUser.power_badge,
                        });
                        
                        setUser(normalizedUser);
                        return; // Exit early after setting user from Neynar
                      }
                    } else {
                      console.warn('[Farcaster] Neynar API returned non-OK status:', neynarResponse.status);
                    }
                  } catch (neynarError: any) {
                    console.error('[Farcaster] ❌ Neynar API fetch failed:', neynarError?.message);
                  }
                }
                
                // Fallback: Use SDK context data if Neynar fetch fails
                console.log('[Farcaster] ⚠️ Using SDK context data as fallback');
                const normalizedUser = {
                  ...userData,
                  fid: fid,
                  username: userData.username || "Farcaster User",
                  displayName: userData.displayName || userData.display_name || userData.username,
                  display_name: userData.display_name || userData.displayName || userData.username,
                  pfpUrl: userData.pfpUrl || userData.pfp || "",
                  pfp_url: userData.pfpUrl || userData.pfp || "",
                  pfp: userData.pfpUrl || userData.pfp || "",
                };
                
                setUser(normalizedUser);
              }
            } catch (contextError: any) {
              console.warn("[Farcaster] Context fetch error:", contextError?.message);
            }
          }
          
          setIsLoaded(true);
        } else if (detectedEnv === 'base-app') {
          // === BASEAPP MODE ===
          console.log('[BaseApp] 🚀 Running in BaseApp mode');
          
          // BaseApp may have similar features to Farcaster miniapp
          // Check if there's user context available
          if (typeof window !== 'undefined') {
            const baseApp = (window as any).base || (window as any).Base;
            if (baseApp?.user) {
              const baseUser = baseApp.user;
              setUser({
                ...baseUser,
                username: baseUser.username || baseUser.displayName,
                pfpUrl: baseUser.pfpUrl || baseUser.pfp,
              });
            }
          }
          
          setIsLoaded(true);
        } else {
          // === WEB BROWSER MODE ===
          console.log('[Environment] Running in web browser mode');
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
      isMiniApp,
      environment
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
