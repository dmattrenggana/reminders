/**
 * Environment Detection Utility
 * Supports: Browser, Farcaster Miniapp, BaseApp
 * 
 * This utility prevents code duplication across components and hooks
 */

import { Connector } from "wagmi";

export type EnvironmentType = 'browser' | 'farcaster-miniapp' | 'base-app';

/**
 * Detect the current environment
 * Returns: 'browser' | 'farcaster-miniapp' | 'base-app'
 */
export function detectEnvironment(): EnvironmentType {
  if (typeof window === 'undefined') return 'browser';
  
  // Check for BaseApp first (BaseApp may also have Farcaster, so check first)
  const hasBaseApp = !!(window as any).base || 
                     !!(window as any).Base ||
                     (window.location?.hostname?.includes('base.org')) ||
                     (typeof window !== 'undefined' && 'base' in window);
  
  // Check for Farcaster miniapp
  const hasFarcasterGlobal = 'Farcaster' in window;
  const hasFarcasterWindow = !!(window as any).Farcaster;
  
  // Check user agent for additional hints
  const userAgent = window.navigator?.userAgent || '';
  const isBaseAppUA = userAgent.includes('BaseApp') || userAgent.includes('Base');
  
  if (hasBaseApp || isBaseAppUA) {
    return 'base-app';
  }
  
  if (hasFarcasterGlobal || hasFarcasterWindow) {
    return 'farcaster-miniapp';
  }
  
  return 'browser';
}

/**
 * Check if running in Farcaster miniapp environment
 * @deprecated Use detectEnvironment() instead for better compatibility
 */
export function isFarcasterMiniApp(): boolean {
  return detectEnvironment() === 'farcaster-miniapp';
}

/**
 * Check if running in BaseApp environment
 */
export function isBaseApp(): boolean {
  return detectEnvironment() === 'base-app';
}

/**
 * Check if running in regular browser environment
 */
export function isBrowser(): boolean {
  return detectEnvironment() === 'browser';
}

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
 * Find BaseApp connector from available connectors
 */
export function findBaseAppConnector(connectors: readonly Connector[]): Connector | undefined {
  return connectors.find((c) => {
    const id = c.id?.toLowerCase() || '';
    const name = c.name?.toLowerCase() || '';
    const type = c.type?.toLowerCase() || '';
    
    return (
      id === "base" ||
      id.includes("base") ||
      name.includes("base") ||
      type.includes("base")
    );
  });
}

/**
 * Get environment name for logging/debugging
 */
export function getEnvironmentName(): string {
  const env = detectEnvironment();
  switch (env) {
    case 'farcaster-miniapp':
      return 'Farcaster Miniapp';
    case 'base-app':
      return 'BaseApp';
    case 'browser':
    default:
      return 'Web Browser';
  }
}
