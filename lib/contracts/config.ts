/**
 * Contract addresses and configuration for Base Mainnet
 *
 * SECURITY NOTE: These NEXT_PUBLIC_ variables contain blockchain contract addresses,
 * which are public information visible on the blockchain explorer. They are NOT
 * authentication tokens or API keys. Client-side access is required for Web3 interactions.
 */

import { parseAbi } from "viem";

export const CONTRACT_ADDRESSES = {
  COMMIT_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  REMINDER_VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT || "",
} as const

export const CONTRACTS = {
  // Blockchain contract addresses (public data, safe to expose)
  COMMIT_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  REMINDER_VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT || "",
}

/**
 * Get RPC URLs - QuickNode only
 * Uses NEXT_PUBLIC_BASE_MAINNET_RPC_URL from environment (must be QuickNode endpoint)
 * Safe for both client-side and server-side execution
 */
function getRpcUrls(): string[] {
  const urls: string[] = [];

  // Only use QuickNode RPC from environment
  // QuickNode format: https://YOUR-ENDPOINT-NAME.base-mainnet.quiknode.pro/YOUR-API-KEY/
  // Note: NEXT_PUBLIC_ prefix makes it available in browser
  try {
    let quickNodeRpc: string | undefined;
    
    if (typeof window !== "undefined") {
      // Client-side: access via process.env (Next.js exposes NEXT_PUBLIC_ vars at build time)
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
        urls.push(quickNodeRpc);
      } else {
        console.warn("[Config] NEXT_PUBLIC_BASE_MAINNET_RPC_URL is not a QuickNode endpoint:", quickNodeRpc);
        // Still use it if configured, but warn
        urls.push(quickNodeRpc);
      }
    } else {
      throw new Error(
        "NEXT_PUBLIC_BASE_MAINNET_RPC_URL is not set. " +
        "Please configure QuickNode RPC endpoint in environment variables."
      );
    }
  } catch (error) {
    // If process is not available or env var not set, throw error
    console.error("[Config] Failed to get QuickNode RPC URL:", error);
    throw error;
  }

  return urls;
}

export const CHAIN_CONFIG = {
  BASE_MAINNET: {
    chainId: 8453,
    name: "Base",
    // RPC URLs - QuickNode only (from NEXT_PUBLIC_BASE_MAINNET_RPC_URL)
    rpcUrls: getRpcUrls(),
    rpcUrl: getRpcUrls()[0] || (() => {
      const qnUrl = typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_BASE_MAINNET_RPC_URL : undefined;
      if (!qnUrl) {
        throw new Error("NEXT_PUBLIC_BASE_MAINNET_RPC_URL is not set. Please configure QuickNode RPC endpoint.");
      }
      return qnUrl;
    })(),
    blockExplorer: "https://basescan.org",
  },
}

export const TOKEN_SYMBOL = "RMND"

export function validateContractConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!CONTRACTS.COMMIT_TOKEN) {
    errors.push("NEXT_PUBLIC_CONTRACT_ADDRESS is not set")
  } else if (!CONTRACTS.COMMIT_TOKEN.startsWith("0x") || CONTRACTS.COMMIT_TOKEN.length !== 42) {
    errors.push("NEXT_PUBLIC_CONTRACT_ADDRESS is not a valid Ethereum address")
  }

  if (!CONTRACTS.REMINDER_VAULT) {
    errors.push("NEXT_PUBLIC_VAULT_CONTRACT is not set")
  } else if (!CONTRACTS.REMINDER_VAULT.startsWith("0x") || CONTRACTS.REMINDER_VAULT.length !== 42) {
    errors.push("NEXT_PUBLIC_VAULT_CONTRACT is not a valid Ethereum address")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const COMMIT_TOKEN_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
])

// Import V5 ABI (30/70 split with signature-based claim, no recordReminder)
import { REMINDER_VAULT_V5_ABI } from "./v5-abi"

// Default ABI: Use V5 only (no backward compatibility with V1/V2/V3/V4)
export const REMINDER_VAULT_ABI = REMINDER_VAULT_V5_ABI
export const REMINDER_VAULT_V5_ABI_EXPORT = REMINDER_VAULT_V5_ABI

// Export aliases
export const VAULT_ABI = REMINDER_VAULT_ABI
export const VAULT_ADDRESS = CONTRACTS.REMINDER_VAULT
export const TOKEN_ADDRESS = CONTRACTS.COMMIT_TOKEN
