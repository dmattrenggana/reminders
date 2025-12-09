"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { ReminderService } from "@/lib/contracts/reminder-service"

export function useReminderService() {
  const { signer, isConnected } = useAuth()

  const service = useMemo(() => {
    if (!signer || !isConnected) return null
    return new ReminderService(signer)
  }, [signer, isConnected])

  return service
}
