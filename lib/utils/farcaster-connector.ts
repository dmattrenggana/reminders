/**
 * Farcaster Connector Utility
 * Centralized logic for finding and connecting to Farcaster miniapp connector
 * 
 * This utility prevents code duplication across components and hooks
 */

import { Connector } from "wagmi";

/**
 * Find Farcaster miniapp connector from available connectors
 * Tries multiple possible IDs/names to ensure compatibility
 */
export function findFarcasterConnector(connectors: readonly Connector[]): Connector | undefined {
  return connectors.find((c) => {
    const id = c.id?.toLowerCase() || '';
    const name = c.name?.toLowerCase() || '';
    const type = c.type?.toLowerCase() || '';
    
    return (
      id === "farcasterminiapp" ||
      id === "io.farcaster.miniapp" ||
      id === "farcaster" ||
      id.includes("farcaster") ||
      id.includes("miniapp") ||
      name.includes("farcaster") ||
      name.includes("miniapp") ||
      type.includes("farcaster") ||
      type.includes("miniapp")
    );
  });
}

/**
 * Check if running in Farcaster miniapp environment
 */
export function isFarcasterMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hasFarcasterGlobal = 'Farcaster' in window;
  const hasFarcasterWindow = !!(window as any).Farcaster;
  
  return hasFarcasterGlobal || hasFarcasterWindow;
}
