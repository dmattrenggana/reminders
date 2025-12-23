/**
 * RPC Provider Utility with Fallback and Retry Logic
 * Handles "too many requests" errors by rotating through multiple RPC endpoints
 */

import { ethers } from "ethers";

// List of Base Mainnet RPC endpoints (ordered by priority)
const RPC_ENDPOINTS = [
  "https://mainnet.base.org", // Official Base RPC (primary)
  "https://base.llamarpc.com", // LlamaRPC (free, reliable)
  "https://base-rpc.publicnode.com", // PublicNode (free, reliable)
  "https://base.gateway.tenderly.co", // Tenderly Gateway
  "https://base-mainnet.g.alchemy.com/v2/demo", // Alchemy (demo, may need API key)
  "https://base-mainnet.public.blastapi.io", // BlastAPI (free tier)
  "https://base.drpc.org", // dRPC (free tier)
] as const;

interface RpcCallOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Create an RPC provider with fallback support
 */
export function createRpcProvider(endpoint?: string): ethers.JsonRpcProvider {
  const rpcUrl = endpoint || RPC_ENDPOINTS[0];
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

  // Try each RPC endpoint
  for (const endpoint of RPC_ENDPOINTS) {
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
          error?.message?.toLowerCase().includes("too many requests") ||
          error?.message?.toLowerCase().includes("rate limit") ||
          error?.code === "ECONNRESET" ||
          error?.code === "ETIMEDOUT";

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
    batchSize = 10, // Process 10 calls at a time
    batchDelay = 100, // 100ms delay between batches
  } = options;

  const results: T[] = [];
  const errors: Error[] = [];

  // Process in batches
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);

    // Execute batch in parallel
    const batchPromises = batch.map((call) =>
      executeRpcCall(call, options).catch((error) => {
        errors.push(error);
        return null;
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

  return results.filter((r) => r !== null) as T[];
}

