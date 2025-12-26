import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, REMINDER_VAULT_ABI } from "@/lib/contracts/config"

export async function GET(request: NextRequest) {
  try {
    const { ethers } = await import("ethers")
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("walletAddress")

    if (!process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL) {
      return NextResponse.json({ error: "RPC URL not configured" }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_ABI, provider)

    const activeReminderIds = await vaultContract.getActiveReminders()
    console.log("[API] Active reminder IDs (raw):", activeReminderIds)

    const reminderIdsArray = Array.isArray(activeReminderIds)
      ? activeReminderIds.map((id) => Number(id.toString()))
      : []

    console.log("[API] Active reminder IDs (converted):", reminderIdsArray)

    const reminders = []

    for (const id of reminderIdsArray) {
      try {
        console.log(`[API] Fetching reminder with ID: ${id}`)
        const reminderData = await vaultContract.reminders(id)
        const canRemindNow = await vaultContract.canRemind(id)

        let hasRecorded = false
        if (walletAddress) {
          try {
            const claimData = await vaultContract.remindClaims(id, walletAddress)
            hasRecorded = claimData.claimed
          } catch (error) {
            console.log(`[API] Could not check claim status for ${walletAddress}:`, error)
          }
        }

        // V5: farcasterUsername at index 7
        const rawFarcasterUsername = reminderData[8]
        const farcasterUsername =
          rawFarcasterUsername && rawFarcasterUsername.trim() !== ""
            ? rawFarcasterUsername
            : reminderData[0].slice(0, 6) + "..." + reminderData[0].slice(-4)

        console.log(`[API] Reminder ${id} data loaded:`, {
          id,
          farcasterUsername,
          description: reminderData[7],
        })

        reminders.push({
          id: id, // Use the converted number directly
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

    console.log(
      "[API] Final reminders array:",
      reminders.map((r) => ({ id: r.id, description: r.description })),
    )

    return NextResponse.json({
      success: true,
      reminders,
    })
  } catch (error) {
    console.error("[API] Error fetching public reminders:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}
