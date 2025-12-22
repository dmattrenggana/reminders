import { useEffect } from "react";
import { useConnect } from "wagmi";

interface UseAutoConnectProps {
  isMiniApp: boolean;
  hasUser: boolean;
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
    if (!mounted || isConnected || !isLoaded) return;
    
    // Add small delay to ensure connectors are ready
    const timer = setTimeout(() => {
      if (isMiniApp && !isConnected) {
        console.log("[Auto-Connect] Detected Farcaster Miniapp, auto-connecting...");
        
        // Find Farcaster miniapp connector
        const fcConnector = connectors.find((c) => 
          c.id === "farcasterMiniApp" || 
          c.id === "io.farcaster.miniapp" ||
          c.name?.toLowerCase().includes("farcaster")
        );
        
        if (fcConnector) {
          console.log("[Auto-Connect] Using Farcaster Miniapp connector:", fcConnector.id);
          connect({ connector: fcConnector }).catch((err) => {
            console.warn("[Auto-Connect] Connection failed:", err);
          });
        } else {
          console.warn("[Auto-Connect] Farcaster connector not found. Available connectors:", 
            connectors.map(c => ({ id: c.id, name: c.name }))
          );
        }
      } else if (!isMiniApp && !isConnected) {
        // Fallback to injected for web browser
        const injectedConnector = connectors.find((c) => c.id === "injected");
        if (injectedConnector) {
          console.log("[Auto-Connect] Using injected connector for web");
          connect({ connector: injectedConnector });
        }
      }
    }, 500); // Small delay to ensure everything is ready
    
    return () => clearTimeout(timer);
  }, [mounted, isMiniApp, isConnected, isLoaded, connect, connectors]);
}

