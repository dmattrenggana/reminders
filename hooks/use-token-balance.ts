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
      setBalance(formatUnits(rawBalance, 18))
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
