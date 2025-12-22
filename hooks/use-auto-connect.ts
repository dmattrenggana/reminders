import { useEffect } from "react";
import { useConnect } from "wagmi";

interface UseAutoConnectProps {
  isMiniApp: boolean;
  hasUser?: boolean; // Optional - user data may not be available immediately
  isConnected: boolean;
  isLoaded: boolean;
  mounted: boolean;
}

/**
 * Auto-connect hook for Farcaster Miniapp
 * Automatically connects wallet when user is in miniapp environment
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
    if (!mounted || isConnected || !isLoaded) {
      if (!mounted) console.log("[Auto-Connect] Waiting for mount...");
      if (isConnected) console.log("[Auto-Connect] Already connected");
      if (!isLoaded) console.log("[Auto-Connect] Waiting for Farcaster to load...");
      return;
    }
    
    console.log("[Auto-Connect] Starting auto-connect process...", {
      isMiniApp,
      isConnected,
      isLoaded,
      mounted,
      connectorCount: connectors.length,
      farcasterReady: typeof window !== 'undefined' ? (window as any).__farcasterReady : false
    });
    
    // Wait for both SDK ready and connectors to be available
    let retryCount = 0;
    const MAX_RETRIES = 20; // Max 4 seconds (20 * 200ms)
    
    const checkAndConnect = () => {
      retryCount++;
      
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
      
      if (isMiniApp && !isConnected) {
        console.log("[Auto-Connect] 🔍 Detected Farcaster Miniapp, attempting auto-connect...");
        console.log("[Auto-Connect] 📋 Available connectors:", 
          connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
        );
        
        // Find Farcaster miniapp connector - try multiple possible IDs
        const fcConnector = connectors.find((c) => {
          const id = c.id?.toLowerCase();
          const name = c.name?.toLowerCase() || '';
          const type = c.type?.toLowerCase() || '';
          
          const matches = (
            id === "farcasterminiapp" ||
            id === "io.farcaster.miniapp" ||
            id === "farcaster" ||
            id?.includes("farcaster") ||
            id?.includes("miniapp") ||
            name.includes("farcaster") ||
            name.includes("miniapp") ||
            type.includes("farcaster") ||
            type.includes("miniapp")
          );
          
          if (matches) {
            console.log("[Auto-Connect] 🔎 Checking connector:", { id, name, type, matches });
          }
          
          return matches;
        });
        
        if (fcConnector) {
          console.log("[Auto-Connect] ✅✅✅ Found Farcaster connector:", {
            id: fcConnector.id,
            name: fcConnector.name,
            type: fcConnector.type,
            ready: fcConnector.ready
          });
          
          try {
            console.log("[Auto-Connect] 🚀 Attempting to connect with connector:", fcConnector.id);
            connect({ connector: fcConnector });
            console.log("[Auto-Connect] ✅ Connect call executed successfully");
          } catch (err: any) {
            console.error("[Auto-Connect] ❌❌❌ Connection failed:", {
              error: err?.message || err,
              code: err?.code,
              name: err?.name,
              stack: err?.stack
            });
            console.log("[Auto-Connect] User will need to connect manually via Connect Wallet button");
          }
        } else {
          console.error("[Auto-Connect] ❌❌❌ Farcaster connector NOT FOUND!");
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
    
    // Start checking after a short delay to ensure everything is initialized
    const timer = setTimeout(checkAndConnect, 1000); // Increased to 1 second to ensure SDK and connectors are ready
    
    return () => clearTimeout(timer);
  }, [mounted, isMiniApp, isConnected, isLoaded, connect, connectors]);
}

