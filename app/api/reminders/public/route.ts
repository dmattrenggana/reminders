import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, REMINDER_VAULT_V2_ABI } from "@/lib/contracts/config"

export async function GET(request: NextRequest) {
  try {
    const { ethers } = await import("ethers")
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("walletAddress")

    if (!process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) {
      return NextResponse.json({ error: "RPC URL not configured" }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, provider)

    const activeReminderIds = await vaultContract.getActiveReminders()
    console.log("[API] Active reminder IDs:", activeReminderIds)

    const reminders = []

    for (const id of activeReminderIds) {
      try {
        const reminderData = await vaultContract.reminders(Number(id))
        const canRemindNow = await vaultContract.canRemind(Number(id))

        let hasRecorded = false
        if (walletAddress) {
          try {
            const claimData = await vaultContract.remindClaims(Number(id), walletAddress)
            hasRecorded = claimData.claimed
          } catch (error) {
            console.log(`[API] Could not check claim status for ${walletAddress}:`, error)
          }
        }

        // V3: index 8, V2: index 8 (same position)
        const rawFarcasterUsername = reminderData[8]
        const farcasterUsername =
          rawFarcasterUsername && rawFarcasterUsername.trim() !== ""
            ? rawFarcasterUsername
            : reminderData[0].slice(0, 6) + "..." + reminderData[0].slice(-4)

        console.log(`[API] Reminder ${id} farcasterUsername:`, farcasterUsername, "raw:", rawFarcasterUsername)

        reminders.push({
          id: Number(id),
          user: reminderData[0],
          farcasterUsername,
          description: reminderData[7],
          reminderTime: new Date(Number(reminderData[3]) * 1000),
          rewardPoolAmount: Number(ethers.formatUnits(reminderData[2], 18)),
          totalReminders: Number(reminderData[9]),
          canRemind: canRemindNow,
          hasRecorded,
        })
      } catch (error) {
        console.error(`[API] Error loading reminder ${id}:`, error)
      }
    }

    console.log("[API] Loaded", reminders.length, "active reminders")

    return NextResponse.json({
      success: true,
      reminders,
    })
  } catch (error) {
    console.error("[API] Error fetching public reminders:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}
