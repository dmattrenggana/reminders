"use client"

import { useState, useEffect, useCallback } from "react"
import { useReminderService } from "./use-reminder-service"
import type { ReminderData } from "@/lib/contracts/reminder-service"
import { formatUnits } from "@/lib/utils/ethers-utils"
import { useAccount } from "wagmi"

export function useReminders() {
  const { address } = useAccount()
  const service = useReminderService()
  const [reminders, setReminders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReminders = useCallback(async () => {
    if (!service || !address) {
      setReminders([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await service.getUserReminders(address)
      
      // Transform data kontrak ke format UI
      const formattedReminders = data.map((r: ReminderData) => ({
        id: Number(r.id),
        description: r.description,
        tokenAmount: Number(formatUnits(r.tokenAmount, 18)),
        reminderTime: new Date(Number(r.reminderTime) * 1000),
        confirmationDeadline: new Date(Number(r.confirmationDeadline) * 1000),
        status: r.status,
        canConfirm: r.canConfirm,
        canClaim: r.canClaim,
        claimableReward: r.claimableReward ? Number(formatUnits(r.claimableReward, 18)) : 0,
        totalHelpers: Number(r.totalHelpers || 0),
        unclaimedRewardPool: r.unclaimedRewardPool ? Number(formatUnits(r.unclaimedRewardPool, 18)) : 0,
        canWithdrawUnclaimed: r.canWithdrawUnclaimed,
        canBurn: r.canBurn
      }))

      setReminders(formattedReminders)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching reminders:", err)
      setError(err.message || "Failed to load reminders")
    } finally {
      setIsLoading(false)
    }
  }, [service, address])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  return {
    reminders,
    isLoading,
    error,
    refresh: fetchReminders
  }
}
