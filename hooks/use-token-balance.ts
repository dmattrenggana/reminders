"use client"

import { useEffect } from "react"
import { useAccount, useReadContracts } from "wagmi"
import { CONTRACTS } from "@/lib/contracts/config"

// ABI minimal untuk token ERC-20 (RMND)
const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;

export function useTokenBalance() {
  const { address, isConnected } = useAccount();
  
  // Alamat Kontrak RMND dari environment variable
  const TOKEN_CONTRACT = CONTRACTS.COMMIT_TOKEN || "";
  
  // Validate token contract address
  useEffect(() => {
    if (!TOKEN_CONTRACT || TOKEN_CONTRACT.length === 0) {
      console.error("[TokenBalance] ⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS is not set in environment variables");
    }
  }, [TOKEN_CONTRACT]);
  
  // Log address for debugging
  useEffect(() => {
    if (address) {
      console.log("[TokenBalance] Using address:", address);
    }
  }, [address]);

  const { data, refetch, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: TOKEN_CONTRACT as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: TOKEN_CONTRACT as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
    query: {
      enabled: !!address && isConnected && !!TOKEN_CONTRACT && TOKEN_CONTRACT.length > 0,
      refetchInterval: 60000, // Refresh every 60 seconds (reduced from 10s to save quota)
      staleTime: 30000, // Consider data stale after 30 seconds (increased from 5s)
      gcTime: 300000, // Keep in cache for 5 minutes (was default 5 minutes)
      retry: 2, // Retry 2 times on failure (reduced from 3)
      refetchOnWindowFocus: false, // Don't refetch on window focus to save quota
      refetchOnReconnect: false, // Don't refetch on reconnect to save quota
    }
  });

  // Log errors for debugging
  if (error) {
    console.warn("[TokenBalance] Error fetching balance:", error);
  }

  // Extract results with better error handling
  const balanceResult = data?.[0]?.result;
  const balanceStatus = data?.[0]?.status;
  const balanceError = data?.[0]?.error;
  
  const symbolResult = (data?.[1]?.result as string) || "RMND";
  const symbolStatus = data?.[1]?.status;
  const symbolError = data?.[1]?.error;
  
  // Log balance for debugging
  useEffect(() => {
    if (address && isConnected) {
      if (error) {
        console.error("[TokenBalance] Query error:", {
          error,
          address,
          isConnected,
          isLoading
        });
      }
      
      // Log contract call status
      if (data && data.length > 0) {
        console.log("[TokenBalance] Contract call status:", {
          balanceStatus,
          balanceError,
          balanceResult: balanceResult?.toString(),
          symbolStatus,
          symbolError,
          symbolResult,
          address,
          isLoading,
          dataLength: data.length
        });
      }
      
      if (balanceResult !== undefined && balanceResult !== null) {
        console.log("[TokenBalance] ✅ Balance fetched:", {
          raw: balanceResult?.toString(),
          type: typeof balanceResult,
          isBigInt: balanceResult instanceof BigInt || typeof balanceResult === 'bigint',
          address,
          symbol: symbolResult
        });
      } else if (!isLoading && balanceStatus === 'success') {
        // Status is success but result is undefined - might be zero balance
        console.log("[TokenBalance] ⚠️ Status success but result undefined - treating as zero balance");
      } else if (!isLoading && balanceStatus === 'failure') {
        console.error("[TokenBalance] ❌ Contract call failed:", {
          balanceError,
          address,
          contract: TOKEN_CONTRACT
        });
      } else if (!isLoading) {
        console.warn("[TokenBalance] ⚠️ Balance is undefined but not loading:", {
          address,
          isConnected,
          balanceStatus,
          balanceError,
          data: data?.map((d: any) => ({ status: d?.status, error: d?.error, result: d?.result }))
        });
      }
    }
  }, [address, isConnected, balanceResult, balanceStatus, balanceError, symbolResult, symbolStatus, symbolError, isLoading, error, data]);

  // Handle case where contract call succeeds but returns undefined/null
  // This can happen if the contract doesn't exist or ABI doesn't match
  let finalBalance: bigint = BigInt(0);
  if (balanceResult !== undefined && balanceResult !== null) {
    if (typeof balanceResult === 'bigint') {
      finalBalance = balanceResult;
    } else if (typeof balanceResult === 'string') {
      try {
        finalBalance = BigInt(balanceResult);
      } catch {
        console.warn("[TokenBalance] Invalid balance string:", balanceResult);
        finalBalance = BigInt(0);
      }
    } else {
      console.warn("[TokenBalance] Unexpected balance type:", typeof balanceResult, balanceResult);
      finalBalance = BigInt(0);
    }
  } else if (balanceStatus === 'failure' || balanceError) {
    // Contract call failed - return zero but log error
    console.error("[TokenBalance] Contract call failed, returning zero balance");
    finalBalance = BigInt(0);
  }

  return {
    balance: finalBalance,
    symbol: symbolResult,
    isLoading,
    refresh: refetch
  }
}
