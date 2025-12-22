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
      connectorCount: connectors.length
    });
    
    // Add delay to ensure connectors are ready
    const timer = setTimeout(() => {
      if (isMiniApp && !isConnected) {
        console.log("[Auto-Connect] Detected Farcaster Miniapp, attempting auto-connect...");
        console.log("[Auto-Connect] Available connectors:", 
          connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
        );
        
        // Find Farcaster miniapp connector - try multiple possible IDs
        const fcConnector = connectors.find((c) => {
          const id = c.id?.toLowerCase();
          const name = c.name?.toLowerCase() || '';
          return (
            id === "farcasterminiapp" ||
            id === "io.farcaster.miniapp" ||
            id === "farcaster" ||
            name.includes("farcaster") ||
            name.includes("miniapp")
          );
        });
        
        if (fcConnector) {
          console.log("[Auto-Connect] ✅ Found Farcaster connector:", {
            id: fcConnector.id,
            name: fcConnector.name,
            type: fcConnector.type
          });
          
          try {
            console.log("[Auto-Connect] Attempting to connect...");
            connect({ connector: fcConnector });
            console.log("[Auto-Connect] ✅ Connect call executed");
          } catch (err: any) {
            console.error("[Auto-Connect] ❌ Connection failed:", err?.message || err);
            console.log("[Auto-Connect] User will need to connect manually via Connect Wallet button");
          }
        } else {
          console.warn("[Auto-Connect] ❌ Farcaster connector not found!");
          console.warn("[Auto-Connect] Available connectors:", 
            connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
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
    }, 1500); // Increased delay to ensure SDK and connectors are fully ready
    
    return () => clearTimeout(timer);
  }, [mounted, isMiniApp, isConnected, isLoaded, connect, connectors]);
}

