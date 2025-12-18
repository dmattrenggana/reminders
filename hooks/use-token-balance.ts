"use client"

import { useState, useEffect, useCallback } from "react"
import { useReminderService } from "./use-reminder-service"
import { useAccount } from "wagmi"
import { formatUnits } from "@/lib/utils/ethers-utils"

export function useTokenBalance() {
  const { address, isConnected } = useAccount()
  const service = useReminderService()
  const [balance, setBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(true)

  const fetchBalance = useCallback(async () => {
    if (!service || !address || !isConnected) {
      setBalance("0")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const rawBalance = await service.getTokenBalance(address)
      
      // Memastikan rawBalance dikonversi ke BigInt sebelum diformat
      // Kita gunakan BigInt(rawBalance.toString()) agar aman jika rawBalance berupa string/hex
      const formattedBalance = formatUnits(BigInt(rawBalance.toString()), 18)
      
      setBalance(formattedBalance)
    } catch (error) {
      console.error("Error fetching token balance:", error)
      setBalance("0")
    } finally {
      setIsLoading(false)
    }
  }, [service, address, isConnected])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    isLoading,
    refresh: fetchBalance
  }
}
