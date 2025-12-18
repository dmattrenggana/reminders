"use client"

import { useEffect, useState } from "react"
import { ReminderService } from "@/lib/contracts/reminder-service"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"

export function useReminderService() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [service, setService] = useState<ReminderService | null>(null)

  useEffect(() => {
    // Service hanya diinisialisasi jika sudah konek wallet dan client tersedia
    if (isConnected && address && publicClient && walletClient) {
      const reminderService = new ReminderService(
        publicClient as any,
        walletClient as any,
        address
      )
      setService(reminderService)
    } else {
      setService(null)
    }
  }, [isConnected, address, publicClient, walletClient])

  return service
}
