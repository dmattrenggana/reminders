import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, REMINDER_VAULT_V2_ABI } from "@/lib/contracts/config"

export async function GET(request: NextRequest) {
  try {
    const { ethers } = await import("ethers")

    if (!process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) {
      return NextResponse.json({ error: "RPC URL not configured" }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, provider)

    const activeReminderIds = await vaultContract.getActiveReminders()

    const reminders = []

    for (const id of activeReminderIds) {
      try {
        const reminderData = await vaultContract.getReminder(Number(id))
        const canRemindNow = await vaultContract.canRemind(Number(id))

        reminders.push({
          id: Number(id),
          user: reminderData[0],
          farcasterUsername: reminderData[8] || reminderData[0].slice(0, 6) + "..." + reminderData[0].slice(-4),
          description: reminderData[7],
          reminderTime: new Date(Number(reminderData[3]) * 1000),
          rewardPoolAmount: Number(ethers.formatUnits(reminderData[2], 18)),
          totalReminders: reminderData[10].length,
          canRemind: canRemindNow,
        })
      } catch (error) {
        console.error(`Error loading reminder ${id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      reminders,
    })
  } catch (error) {
    console.error("Error fetching public reminders:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}
