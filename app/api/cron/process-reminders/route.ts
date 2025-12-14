import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, REMINDER_VAULT_V2_ABI } from "@/lib/contracts/config"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || !process.env.CRON_WALLET_PRIVATE_KEY) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          details: "Please set NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL and CRON_WALLET_PRIVATE_KEY",
        },
        { status: 500 },
      )
    }

    const { ethers } = await import("ethers")

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
    const wallet = new ethers.Wallet(process.env.CRON_WALLET_PRIVATE_KEY, provider)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, wallet)

    const currentTime = Math.floor(Date.now() / 1000)
    const processedReminders = []
    const errors = []

    const reminderCount = await vaultContract.nextReminderId()
    console.log(`[v0] Cron: Checking ${reminderCount} reminders for expiration`)

    for (let i = 0; i < Number(reminderCount); i++) {
      try {
        const reminder = await vaultContract.reminders(i)

        let user,
          commitAmount,
          rewardPoolAmount,
          reminderTime,
          confirmationDeadline,
          confirmed,
          burned,
          description,
          farcasterUsername,
          totalReminders,
          rewardsClaimed

        if (reminder.length === 12) {
          // V3 contract with confirmationTime field at index 11
          ;[
            user,
            commitAmount,
            rewardPoolAmount,
            reminderTime,
            confirmationDeadline,
            confirmed,
            burned,
            description,
            farcasterUsername,
            totalReminders,
            rewardsClaimed,
            // confirmationTime (not used here)
          ] = reminder
        } else {
          // V2 contract without confirmationTime
          ;[
            user,
            commitAmount,
            rewardPoolAmount,
            reminderTime,
            confirmationDeadline,
            confirmed,
            burned,
            description,
            farcasterUsername,
            totalReminders,
            rewardsClaimed,
          ] = reminder
        }

        // Skip already processed reminders
        if (confirmed || burned) continue

        if (currentTime > Number(confirmationDeadline)) {
          console.log(`[v0] Cron: Burning expired reminder ${i} for ${farcasterUsername || "wallet user"}`)

          // Burns 50% commitment tokens to 0xdead
          // Returns 50% reward pool to user
          const tx = await vaultContract.burnMissedReminder(i)
          const receipt = await tx.wait()

          processedReminders.push({
            id: i,
            action: "burned_missed_reminder",
            user,
            farcasterUsername: farcasterUsername || "wallet user",
            commitmentBurned: ethers.formatUnits(commitAmount, 18),
            rewardPoolReturned: ethers.formatUnits(rewardPoolAmount, 18),
            helpersCount: Number(totalReminders),
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
          })

          console.log(`[v0] Cron: Successfully burned reminder ${i}, tx: ${tx.hash}`)
        }
      } catch (error: any) {
        console.error(`[v0] Cron: Error processing reminder ${i}:`, error.message)
        errors.push({
          id: i,
          error: error.message,
        })
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      totalChecked: Number(reminderCount),
      processed: processedReminders.length,
      reminders: processedReminders,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log(`[v0] Cron: Completed. Processed ${processedReminders.length} expired reminders`)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed", message: error.message }, { status: 500 })
  }
}
