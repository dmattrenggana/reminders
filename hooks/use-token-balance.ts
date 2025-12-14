"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useReminderService } from "./use-reminder-service"

export function useTokenBalance() {
  const { address, isConnected, farcasterUser } = useAuth()
  const service = useReminderService()
  const [balance, setBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(true)

  const loadBalance = useCallback(async () => {
    console.log("[v0] ===== TOKEN BALANCE LOADING =====")
    console.log("[v0] Service available:", !!service)
    console.log("[v0] Address:", address)
    console.log("[v0] Is connected:", isConnected)
    console.log("[v0] Farcaster user:", farcasterUser?.username || "none")

    if (!service) {
      console.log("[v0] ❌ No service available, cannot load balance")
      setIsLoading(false)
      return
    }

    if (!address) {
      console.log("[v0] ❌ No address available, cannot load balance")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log("[v0] 🔄 Fetching token balance for address:", address)
      const bal = await service.getTokenBalance(address)
      console.log("[v0] ✅ Token balance loaded:", bal)
      setBalance(bal)
    } catch (error) {
      console.error("[v0] ❌ Error loading token balance:", error)
      setBalance("0")
    } finally {
      setIsLoading(false)
      console.log("[v0] ===== TOKEN BALANCE LOADING COMPLETE =====")
    }
  }, [service, address, isConnected, farcasterUser])

  useEffect(() => {
    if (address) {
      console.log("[v0] Address changed to:", address, "- loading balance...")
      loadBalance()
    } else {
      console.log("[v0] No address, skipping balance load")
      setIsLoading(false)
    }
  }, [address, loadBalance])

  const refresh = useCallback(() => {
    console.log("[v0] Manual balance refresh triggered")
    loadBalance()
  }, [loadBalance])

  return {
    balance,
    isLoading,
    refresh,
  }
}
