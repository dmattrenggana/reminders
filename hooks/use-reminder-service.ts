"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { ReminderService } from "@/lib/contracts/reminder-service"

export function useReminderService() {
  const { signer, isConnected, address, ensureSigner } = useAuth()
  const [service, setService] = useState<ReminderService | null>(null)

  useEffect(() => {
    if (!isConnected && !address) {
      console.log("[v0] Not connected, clearing service")
      setService(null)
      return
    }

    if (service) {
      console.log("[v0] Service already exists")
      return
    }

    console.log("[v0] Creating ReminderService with signer:", !!signer)
    const newService = new ReminderService(signer || { getAddress: async () => address })
    setService(newService)
  }, [isConnected, address, signer])

  return service
}
