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
    if (!mounted || isConnected || !isLoaded) return;
    
    // Add small delay to ensure connectors are ready
    const timer = setTimeout(() => {
      if (isMiniApp && !isConnected) {
        console.log("[Auto-Connect] Detected Farcaster Miniapp, attempting auto-connect...");
        
        // Find Farcaster miniapp connector
        const fcConnector = connectors.find((c) => 
          c.id === "farcasterMiniApp" || 
          c.id === "io.farcaster.miniapp" ||
          c.name?.toLowerCase().includes("farcaster")
        );
        
        if (fcConnector) {
          console.log("[Auto-Connect] Using Farcaster Miniapp connector:", fcConnector.id);
          try {
            connect({ connector: fcConnector });
          } catch (err) {
            console.warn("[Auto-Connect] Connection failed (user may need to connect manually):", err);
          }
        } else {
          console.warn("[Auto-Connect] Farcaster connector not found. Available connectors:", 
            connectors.map(c => ({ id: c.id, name: c.name }))
          );
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
    }, 1000); // Increased delay to ensure SDK and connectors are fully ready
    
    return () => clearTimeout(timer);
  }, [mounted, isMiniApp, isConnected, isLoaded, connect, connectors]);
}

