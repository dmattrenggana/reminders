"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { ReminderService } from "@/lib/contracts/reminder-service"

export function useReminderService() {
  const { signer, isConnected, address } = useAuth()
  const [service, setService] = useState<ReminderService | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

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

    if (isInitializing) {
      console.log("[v0] Service initialization already in progress")
      return
    }

    const initService = async () => {
      setIsInitializing(true)
      console.log("[v0] Creating ReminderService...")
      console.log("[v0] - Has signer:", !!signer)
      console.log("[v0] - Address:", address)

      try {
        if (typeof window !== "undefined" && window.self !== window.top) {
          console.log("[v0] Detected miniapp context, waiting for wallet...")
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        const newService = new ReminderService(signer || { getAddress: async () => address })
        setService(newService)
        console.log("[v0] ✅ ReminderService created successfully")
      } catch (error) {
        console.error("[v0] Failed to create ReminderService:", error)
        // Service will be null, components can handle this
      } finally {
        setIsInitializing(false)
      }
    }

    initService()
  }, [isConnected, address, signer, service, isInitializing])

  return service
}
