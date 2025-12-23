import { useEffect } from "react";
import { useConnect } from "wagmi";
import { findFarcasterConnector } from "@/lib/utils/farcaster-connector";

interface UseAutoConnectProps {
  isMiniApp: boolean;
  hasUser?: boolean; // Optional - user data may not be available immediately
  isConnected: boolean;
  isLoaded: boolean;
  mounted: boolean;
}

/**
 * Auto-connect hook for Farcaster Miniapp
 * 
 * Per Farcaster docs: https://miniapps.farcaster.xyz/docs/guides/wallets
 * "If a user already has a connected wallet the connector will automatically connect to it"
 * 
 * This hook:
 * 1. Waits for connector to auto-connect (if user has wallet)
 * 2. Only manually connects if auto-connect doesn't happen after delay
 * 3. Handles both miniapp and web browser environments
 */
export function useAutoConnect({
  isMiniApp,
  hasUser,
  isConnected,
  isLoaded,
  mounted,
}: UseAutoConnectProps) {
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Early returns - don't attempt connection if conditions not met
    if (!mounted) {
      console.log("[Auto-Connect] Waiting for mount...");
      return;
    }
    
    if (!isLoaded) {
      console.log("[Auto-Connect] Waiting for Farcaster to load...");
      return;
    }
    
    // ✅ CRITICAL: Per Farcaster docs, connector auto-connects if user has wallet
    // Check isConnected FIRST before attempting manual connect
    if (isConnected) {
      console.log("[Auto-Connect] ✅ Already connected (connector auto-connected)");
      return;
    }
    
    console.log("[Auto-Connect] Starting connection process...", {
      isMiniApp,
      isConnected,
      isLoaded,
      mounted,
      connectorCount: connectors.length,
      farcasterReady: typeof window !== 'undefined' ? (window as any).__farcasterReady : false
    });
    
    // Per Farcaster docs: Connector auto-connects if user has wallet
    // Wait a bit to see if auto-connect happens, then manually connect if needed
    let retryCount = 0;
    const MAX_RETRIES = 15; // Max 3 seconds (15 * 200ms) to wait for auto-connect
    const AUTO_CONNECT_WAIT = 500; // Initial wait for auto-connect
    
    const checkAndConnect = () => {
      retryCount++;
      
      // Check if already connected (auto-connect may have happened)
      // This check is done via the effect dependency, but we check here too for safety
      
      // In miniapp, wait for ready() to be called first
      const isReady = !isMiniApp || (typeof window !== 'undefined' && (window as any).__farcasterReady);
      
      if (!isReady && retryCount < MAX_RETRIES) {
        console.log(`[Auto-Connect] Waiting for sdk.actions.ready() to complete... (attempt ${retryCount}/${MAX_RETRIES})`);
        setTimeout(checkAndConnect, 200);
        return;
      }
      
      if (retryCount >= MAX_RETRIES) {
        console.warn("[Auto-Connect] ⚠️ Max retries reached, proceeding anyway...");
      }
      
      // Only manually connect if still not connected (auto-connect didn't happen)
      if (isMiniApp) {
        console.log("[Auto-Connect] 🔍 Detected Farcaster Miniapp");
        console.log("[Auto-Connect] 📋 Available connectors:", 
          connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
        );
        
        // Use centralized utility to find Farcaster connector
        const fcConnector = findFarcasterConnector(connectors);
        
        if (fcConnector) {
          console.log("[Auto-Connect] ✅ Found Farcaster connector:", {
            id: fcConnector.id,
            name: fcConnector.name,
            type: fcConnector.type
          });
          
          // Per Farcaster docs: "If a user already has a connected wallet the connector will automatically connect"
          // We only manually connect if auto-connect didn't happen
          // Note: Connector doesn't have a 'ready' property in Wagmi types, so we proceed with connect
          try {
            console.log("[Auto-Connect] 🚀 Manual connect (auto-connect didn't happen):", fcConnector.id);
            connect({ connector: fcConnector });
            console.log("[Auto-Connect] ✅ Connect call executed");
          } catch (err: any) {
            console.error("[Auto-Connect] ❌ Connection failed:", {
              error: err?.message || err,
              code: err?.code,
              name: err?.name
            });
            console.log("[Auto-Connect] User can connect manually via Connect Wallet button");
          }
        } else {
          console.error("[Auto-Connect] ❌ Farcaster connector NOT FOUND!");
          console.error("[Auto-Connect] Available connectors:", 
            connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
          );
          console.error("[Auto-Connect] This is a CRITICAL issue - connector should be available in miniapp");
          console.log("[Auto-Connect] User will need to connect manually via Connect Wallet button");
        }
      } else if (!isMiniApp && !isConnected) {
        // Fallback to injected for web browser
        const injectedConnector = connectors.find((c) => c.id === "injected");
        if (injectedConnector) {
          console.log("[Auto-Connect] Using injected connector for web");
          connect({ connector: injectedConnector });
        }
      }
    };
    
    // Per Farcaster docs: Connector auto-connects if user has wallet
    // Wait a bit for auto-connect, then manually connect if needed
    // Start checking after initial delay to allow auto-connect to happen
    const timer = setTimeout(checkAndConnect, AUTO_CONNECT_WAIT);
    
    return () => clearTimeout(timer);
  }, [mounted, isMiniApp, isConnected, isLoaded, connect, connectors]);
}
