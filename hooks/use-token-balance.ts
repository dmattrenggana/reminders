"use client"

import { useEffect } from "react"
import { useAccount, useReadContracts } from "wagmi"

// ABI minimal untuk token ERC-20 (RMNDtest)
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
  
  // Alamat Kontrak RMNDtest kamu di Base
  const TOKEN_CONTRACT = "0x6ee85c2cfab33678de10a5e1634d86abb5eebb07";
  
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
      enabled: !!address && isConnected,
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

  // Debug logging
  const balanceResult = data?.[0]?.result;
  const symbolResult = (data?.[1]?.result as string) || "RMNDtest";
  
  // Log balance for debugging
  if (address && isConnected && balanceResult !== undefined) {
    console.log("[TokenBalance] Raw balance:", {
      raw: balanceResult,
      type: typeof balanceResult,
      address,
      symbol: symbolResult
    });
  }

  return {
    // Menggunakan BigInt(0) agar lolos build Vercel
    balance: balanceResult ?? BigInt(0), 
    symbol: symbolResult,
    isLoading,
    refresh: refetch
  }
}
