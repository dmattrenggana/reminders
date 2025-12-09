"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useReminderService } from "./use-reminder-service"

export function useTokenBalance() {
  const { address, isConnected } = useAuth()
  const service = useReminderService()
  const [balance, setBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(true)

  const loadBalance = useCallback(async () => {
    if (!service || !address) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const bal = await service.getTokenBalance(address)
      setBalance(bal)
    } catch (error) {
      console.error("[v0] Error loading token balance:", error)
      setBalance("0")
    } finally {
      setIsLoading(false)
    }
  }, [service, address])

  useEffect(() => {
    if (isConnected && address) {
      loadBalance()
    }
  }, [isConnected, address, loadBalance])

  const refresh = useCallback(() => {
    loadBalance()
  }, [loadBalance])

  return {
    balance,
    isLoading,
    refresh,
  }
}
