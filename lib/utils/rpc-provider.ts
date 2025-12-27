/**
 * RPC Provider Utility with Fallback and Retry Logic
 * Handles "too many requests" errors by rotating through multiple RPC endpoints
 */

import { ethers } from "ethers";

/**
 * Get RPC endpoints list - QuickNode only
 * Uses NEXT_PUBLIC_BASE_MAINNET_RPC_URL from environment (must be QuickNode endpoint)
 */
function getRpcEndpoints(): string[] {
  const endpoints: string[] = [];

  // Only use QuickNode RPC from environment
  // QuickNode format: https://YOUR-ENDPOINT-NAME.base-mainnet.quiknode.pro/YOUR-API-KEY/
  // Note: NEXT_PUBLIC_ prefix makes it available in browser
  let quickNodeRpc: string | undefined;
  
  if (typeof window !== "undefined") {
    // Client-side: access via process.env (Next.js exposes NEXT_PUBLIC_ vars)
    quickNodeRpc = (typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_BASE_MAINNET_RPC_URL) 
      ? String(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL).trim()
      : undefined;
  } else {
    // Server-side: direct access
    quickNodeRpc = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_MAINNET_RPC_URL
      ? String(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL).trim()
      : undefined;
  }

  if (quickNodeRpc && quickNodeRpc.length > 0) {
    // Verify it's a QuickNode endpoint
    if (quickNodeRpc.includes("quiknode.pro") || quickNodeRpc.includes("quicknode")) {
      endpoints.push(quickNodeRpc);
    } else {
      console.warn("[RPC] NEXT_PUBLIC_BASE_MAINNET_RPC_URL is not a QuickNode endpoint:", quickNodeRpc);
      // Still use it if configured, but warn
      endpoints.push(quickNodeRpc);
    }
  } else {
    throw new Error(
      "NEXT_PUBLIC_BASE_MAINNET_RPC_URL is not set. " +
      "Please configure QuickNode RPC endpoint in environment variables. " +
      "Format: https://YOUR-ENDPOINT-NAME.base-mainnet.quiknode.pro/YOUR-API-KEY/"
    );
  }

  return endpoints;
}

// Get RPC endpoints (will be evaluated once per module load)
const RPC_ENDPOINTS = getRpcEndpoints();

interface RpcCallOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Create an RPC provider with fallback support
 * Tests connection and falls back to next endpoint if needed
 */
export async function createRpcProvider(endpoint?: string): Promise<ethers.JsonRpcProvider> {
  // Refresh endpoints in case env var changed (for development)
  const endpoints = getRpcEndpoints();
  
  // If specific endpoint provided, use it
  if (endpoint) {
    return new ethers.JsonRpcProvider(endpoint, undefined, {
      staticNetwork: true,
    });
  }
  
  // Try endpoints in order until one works
  for (const rpcUrl of endpoints) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true,
      });
      
      // Test connection with timeout - reduced for faster failover
      await Promise.race([
        provider.getNetwork(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)), // Increased from 2s to 5s for better stability
      ]);
      
      return provider;
    } catch (e) {
      console.log(`[RPC] Endpoint failed, trying next: ${rpcUrl.slice(0, 30)}...`);
      continue;
    }
  }
  
  throw new Error("Could not connect to any RPC endpoint");
}

/**
 * Execute RPC call with automatic retry and fallback
 */
export async function executeRpcCall<T>(
  callFn: (provider: ethers.JsonRpcProvider) => Promise<T>,
  options: RpcCallOptions = {}
): Promise<T> {
  const {
    maxRetries = 2, // Reduced from 3 to 2 to fail faster on rate limits and avoid more 429 errors
    retryDelay = 2000, // Increased from 1000ms to 2000ms (2 seconds) for better stability
    timeout = 20000, // Increased from 15s to 20s for better reliability
  } = options;

  let lastError: Error | null = null;
  let usedEndpoints: string[] = [];

  // Get fresh endpoints list (in case env var changed)
  const endpoints = getRpcEndpoints();

  // Try each RPC endpoint
  for (const endpoint of endpoints) {
    // Skip if already tried
    if (usedEndpoints.includes(endpoint)) {
      continue;
    }

    const provider = await createRpcProvider(endpoint);

    // Try with retries for this endpoint
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("RPC call timeout")), timeout);
        });

        // Execute call with timeout
        const result = await Promise.race([
          callFn(provider),
          timeoutPromise,
        ]);

        // Success - return result
        return result;
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error (429 or "too many requests")
        const isRateLimit =
          error?.statusCode === 429 ||
          error?.status === 429 ||
          error?.response?.status === 429 ||
          error?.message?.toLowerCase().includes("too many requests") ||
          error?.message?.toLowerCase().includes("rate limit") ||
          error?.message?.toLowerCase().includes("429") ||
          error?.code === "ECONNRESET" ||
          error?.code === "ETIMEDOUT" ||
          (error?.error?.code && error.error.code === -32005); // JSON-RPC rate limit code

        // If rate limit, wait longer before retrying or trying next endpoint
        if (isRateLimit) {
          // Only log once per call, not for every retry attempt (to reduce console spam)
          if (attempt === 0) {
            console.warn(`[RPC] Rate limit (429) detected, will retry with backoff...`);
          }
          // Wait longer for rate limit (exponential backoff: 5s, 10s, 20s)
          const rateLimitDelay = 5000 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, rateLimitDelay));
          
          // If last attempt on this endpoint, try next endpoint
          if (attempt === maxRetries - 1) {
            usedEndpoints.push(endpoint);
            break; // Break retry loop, try next endpoint
          }
          continue; // Retry same endpoint after delay
        }

        // If not rate limit and not last attempt, wait and retry
        if (attempt < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(
            `[RPC] Attempt ${attempt + 1} failed on ${endpoint}, retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Mark endpoint as used
    usedEndpoints.push(endpoint);
  }

  // All endpoints failed
  throw new Error(
    `All RPC endpoints failed. Last error: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Batch execute multiple RPC calls with rate limiting
 */
export async function batchRpcCalls<T>(
  calls: Array<(provider: ethers.JsonRpcProvider) => Promise<T>>,
  options: RpcCallOptions & { batchSize?: number; batchDelay?: number; maxParallel?: number } = {}
): Promise<T[]> {
  const {
    batchSize = 3, // Reduced from 5 to 3 to prevent 429 rate limit errors
    batchDelay = 1000, // Increased from 500ms to 1000ms (1 second) to prevent rate limiting
    maxParallel = 2, // Reduced from 3 to 2 to prevent overwhelming RPC endpoint
  } = options;

  const results: (T | null)[] = [];
  const errors: Error[] = [];

  // Process in batches with parallel limit and request delays
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);

    // Process batch with max parallel limit
    // Split batch into smaller chunks to limit parallel requests
    for (let j = 0; j < batch.length; j += maxParallel) {
      const parallelChunk = batch.slice(j, j + maxParallel);
      
      // Execute parallel chunk with staggered delays (500ms between requests to prevent 429 errors)
      const chunkPromises = parallelChunk.map(async (call, index) => {
        // Stagger requests: first request immediate, others with 500ms delay to prevent rate limiting
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Increased to 500ms to prevent 429 errors
        }
        
        try {
          return await executeRpcCall(call, options);
        } catch (error) {
          errors.push(error as Error);
          return null as T | null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    // Delay between batches to avoid rate limiting
    if (i + batchSize < calls.length) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }

  // If all calls failed, throw error
  if (results.every((r) => r === null) && errors.length > 0) {
    throw errors[0];
  }

  // Filter out null results and return valid results
  return results.filter((r): r is T => r !== null);
}
