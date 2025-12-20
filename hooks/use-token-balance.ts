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

  const { data, refetch, isLoading } = useReadContracts({
    contracts: [
      {
        address: TOKEN_CONTRACT,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: TOKEN_CONTRACT,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 20000, // Update otomatis tiap 20 detik
    }
  });

  return {
    // Menggunakan BigInt(0) agar tidak error "BigInt literals" saat build
    balance: data?.[0]?.result ?? BigInt(0), 
    symbol: (data?.[1]?.result as string) || "RMNDtest",
    isLoading,
    refresh: refetch
  }
}
