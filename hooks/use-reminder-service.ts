"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { ReminderService } from "@/lib/contracts/reminder-service"

export function useReminderService() {
  const { signer, isConnected, address } = useAuth()

  const service = useMemo(() => {
    if (!isConnected && !address) return null

    // Pass signer if available, otherwise pass null for read-only mode
    return new ReminderService(signer || null)
  }, [signer, isConnected, address])

  return service
}
