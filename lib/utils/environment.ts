/**
 * Environment detection utilities for Farcaster Miniapp
 * Based on: https://miniapps.farcaster.xyz/docs/sdk/compatibility
 */

/**
 * Detects if the app is running inside a Farcaster miniapp client
 * @returns true if running in miniapp, false if running in web browser
 */
export function isMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for Farcaster global object (injected by miniapp client)
  return 'Farcaster' in window;
}

/**
 * Detects the current environment asynchronously
 * @returns 'miniapp' or 'web'
 */
export async function detectEnvironment(): Promise<'miniapp' | 'web'> {
  if (typeof window === 'undefined') return 'web';
  
  try {
    // Dynamic import to avoid issues in SSR
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const context = await sdk.context;
    
    // If context.client exists, we're in a miniapp
    return context.client ? 'miniapp' : 'web';
  } catch (error) {
    // If SDK throws error, we're likely in a web browser
    console.log('Not running in Farcaster miniapp, falling back to web mode');
    return 'web';
  }
}

/**
 * Gets the environment name for logging
 */
export function getEnvironmentName(): string {
  return isMiniApp() ? 'Farcaster Miniapp' : 'Web Browser';
}
