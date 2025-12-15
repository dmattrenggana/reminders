"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { ReminderService } from "@/lib/contracts/reminder-service"

export function useReminderService() {
  const { signer, isConnected, address } = useAuth()

  const service = useMemo(() => {
    if (!isConnected && !address) {
      console.log("[v0] Not connected, no service")
      return null
    }

    console.log("[v0] Creating ReminderService with signer:", !!signer)
    // Pass signer if available, otherwise pass a dummy signer for initialization
    return new ReminderService(signer || { getAddress: async () => address })
  }, [signer, isConnected, address])

  return service
}
