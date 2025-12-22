"use client"

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
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
      retry: 3, // Retry 3 times on failure
    }
  });

  // Log errors for debugging
  if (error) {
    console.warn("[TokenBalance] Error fetching balance:", error);
  }

  return {
    // Menggunakan BigInt(0) agar lolos build Vercel
    balance: data?.[0]?.result ?? BigInt(0), 
    symbol: (data?.[1]?.result as string) || "RMNDtest",
    isLoading,
    refresh: refetch
  }
}
