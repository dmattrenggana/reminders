/**
 * RPC Provider Utility with Fallback and Retry Logic
 * Handles "too many requests" errors by rotating through multiple RPC endpoints
 */

import { ethers } from "ethers";

/**
 * Get RPC endpoints list with priority order
 * Premium RPC (from env) takes highest priority if configured
 */
function getRpcEndpoints(): string[] {
  const endpoints: string[] = [];

  // Priority 1: Premium RPC from environment (if configured)
  // Alchemy: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
  // Infura: https://base-mainnet.infura.io/v3/YOUR_API_KEY
  // QuickNode: https://YOUR-ENDPOINT-NAME.base.quiknode.pro/YOUR-API-KEY/
  // Note: NEXT_PUBLIC_ prefix makes it available in browser
  if (typeof window !== "undefined") {
    // Client-side: access via window or process.env (Next.js exposes NEXT_PUBLIC_ vars)
    const customRpc = (process?.env?.NEXT_PUBLIC_BASE_MAINNET_RPC_URL as string)?.trim();
    if (customRpc && !customRpc.includes("mainnet.base.org")) {
      // Only add if it's not the default (which has rate limiting)
      endpoints.push(customRpc);
    }
  } else {
    // Server-side: direct access
    const customRpc = process.env?.NEXT_PUBLIC_BASE_MAINNET_RPC_URL?.trim();
    if (customRpc && !customRpc.includes("mainnet.base.org")) {
      endpoints.push(customRpc);
    }
  }

  // Priority 2: Free reliable RPCs (less rate limiting)
  endpoints.push(
    "https://base.llamarpc.com", // LlamaRPC (free, reliable, less rate limiting)
    "https://base-rpc.publicnode.com", // PublicNode (free, reliable)
    "https://base.drpc.org", // dRPC (free tier, reliable)
    "https://base-mainnet.public.blastapi.io", // BlastAPI (free tier)
    "https://base.gateway.tenderly.co", // Tenderly Gateway
  );

  // Priority 3: Official Base RPC (moved lower due to frequent 429 rate limiting)
  endpoints.push("https://mainnet.base.org");

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
 * If endpoint is not provided, uses first endpoint from priority list
 */
export function createRpcProvider(endpoint?: string): ethers.JsonRpcProvider {
  // Refresh endpoints in case env var changed (for development)
  const endpoints = getRpcEndpoints();
  const rpcUrl = endpoint || endpoints[0];
  
  return new ethers.JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: true,
  });
}

/**
 * Execute RPC call with automatic retry and fallback
 */
export async function executeRpcCall<T>(
  callFn: (provider: ethers.JsonRpcProvider) => Promise<T>,
  options: RpcCallOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
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

    const provider = createRpcProvider(endpoint);

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

        // If rate limit, try next endpoint immediately
        if (isRateLimit) {
          console.warn(`[RPC] Rate limit on ${endpoint}, trying next endpoint...`);
          usedEndpoints.push(endpoint);
          break; // Break retry loop, try next endpoint
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
  options: RpcCallOptions & { batchSize?: number; batchDelay?: number } = {}
): Promise<T[]> {
  const {
    batchSize = 5, // Process 5 calls at a time (reduced to avoid rate limiting)
    batchDelay = 300, // 300ms delay between batches (increased to avoid rate limiting)
  } = options;

  const results: (T | null)[] = [];
  const errors: Error[] = [];

  // Process in batches
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);

    // Execute batch in parallel
    const batchPromises = batch.map((call) =>
      executeRpcCall(call, options).catch((error) => {
        errors.push(error);
        return null as T | null;
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

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
