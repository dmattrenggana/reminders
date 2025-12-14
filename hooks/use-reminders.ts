"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useReminderService } from "./use-reminder-service"
import type { ReminderData } from "@/lib/contracts/reminder-service"
import { formatUnits } from "@/lib/utils/ethers-utils"

export interface Reminder {
  id: number
  description: string
  tokenAmount: number
  reminderTime: Date
  confirmationDeadline: Date
  status: "pending" | "active" | "completed" | "burned"
  canConfirm: boolean
}

export function useReminders() {
  const { address, isConnected } = useAuth()
  const service = useReminderService()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapReminderData = async (data: ReminderData): Promise<Reminder> => {
    try {
      const reminderTime = new Date(Number(data.reminderTime) * 1000)
      const confirmationDeadline = new Date(Number(data.confirmationDeadline) * 1000)
      const now = Date.now()
      const notificationStartTime = reminderTime.getTime() - 60 * 60 * 1000

      let status: Reminder["status"]
      if (data.burned) {
        status = "burned"
      } else if (data.confirmed) {
        status = "completed"
      } else if (now >= notificationStartTime && now <= confirmationDeadline.getTime()) {
        status = "active"
      } else {
        status = "pending"
      }

      let canConfirm = false
      if (!data.confirmed && !data.burned && now >= notificationStartTime && now <= confirmationDeadline.getTime()) {
        canConfirm = true
      }

      const totalTokens = Number(formatUnits(data.commitmentAmount + data.rewardPoolAmount, 18))

      return {
        id: data.id,
        description: data.description,
        tokenAmount: totalTokens,
        reminderTime,
        confirmationDeadline,
        status,
        canConfirm,
      }
    } catch (err) {
      console.error("[v0] Error mapping reminder data:", err)
      return {
        id: data.id,
        description: data.description || "Unknown reminder",
        tokenAmount: 0,
        reminderTime: new Date(),
        confirmationDeadline: new Date(),
        status: "pending",
        canConfirm: false,
      }
    }
  }

  const loadReminders = useCallback(async () => {
    if (!isConnected || !address) {
      setReminders([])
      setIsLoading(false)
      setError(null)
      return
    }

    if (!service) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log("[v0] Loading reminders for address:", address)

      const rawReminders = await service.getUserReminders(address)
      console.log("[v0] Raw reminders loaded:", rawReminders.length)

      const mappedReminders = await Promise.all(rawReminders.map((data) => mapReminderData(data)))

      // Sort by reminder time (most recent first)
      mappedReminders.sort((a, b) => b.reminderTime.getTime() - a.reminderTime.getTime())

      setReminders(mappedReminders)
    } catch (err: any) {
      console.error("[v0] Error loading reminders:", err)
      setError(err.message || "Failed to load reminders")
      setReminders([])
    } finally {
      setIsLoading(false)
    }
  }, [service, address, isConnected])

  useEffect(() => {
    if (isConnected && address) {
      loadReminders()
    } else {
      setReminders([])
      setIsLoading(false)
      setError(null)
    }
  }, [isConnected, address, loadReminders])

  const refresh = useCallback(() => {
    loadReminders()
  }, [loadReminders])

  return {
    reminders,
    isLoading,
    error,
    refresh,
  }
}
