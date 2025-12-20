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
      // Refetch otomatis setiap 20 detik untuk update saldo terbaru
      refetchInterval: 20000, 
    }
  });

  return {
    // data[0] adalah balanceOf, data[1] adalah symbol
    balance: data?.[0]?.result ?? 0n, 
    symbol: (data?.[1]?.result as string) || "RMNDtest",
    isLoading,
    refresh: refetch
  }
}
