import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, REMINDER_VAULT_ABI } from "@/lib/contracts/config"

/**
 * Cron Job: Process Expired Reminders
 * 
 * Schedule: Every 15 minutes (*/15 * * * *)
 * 
 * This cron job:
 * 1. Checks all reminders for expired confirmationDeadline
 * 2. Automatically burns 30% commitment tokens for missed reminders
 * 3. Returns unclaimed 70% reward pool to reminder creator
 * 
 * Runs automatically via Vercel Cron Jobs
 */
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || !process.env.CRON_WALLET_PRIVATE_KEY) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          details: "Please set NEXT_PUBLIC_BASE_MAINNET_RPC_URL and CRON_WALLET_PRIVATE_KEY",
        },
        { status: 500 },
      )
    }

    const { ethers } = await import("ethers")

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL)
    const wallet = new ethers.Wallet(process.env.CRON_WALLET_PRIVATE_KEY, provider)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_ABI, wallet)

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
          rewardsClaimed,
          confirmationTime

        if (reminder.length === 12) {
          // V4/V3 contract with confirmationTime field at index 11
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
            confirmationTime,
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

        // Check if deadline has passed
        if (currentTime > Number(confirmationDeadline)) {
          const deadlineDate = new Date(Number(confirmationDeadline) * 1000).toISOString()
          console.log(
            `[v0] Cron: Deadline passed for reminder ${i} (deadline: ${deadlineDate}, current: ${new Date().toISOString()})`
          )
          console.log(`[v0] Cron: Burning expired reminder ${i} for ${farcasterUsername || "wallet user"}`)

          // V4: Burns 30% commitment tokens to 0xdead
          // V4: Returns unclaimed portion of 70% reward pool to user
          const tx = await vaultContract.burnMissedReminder(i)
          const receipt = await tx.wait()

          // Calculate unclaimed rewards (V4 returns unclaimed portion, not full reward pool)
          // Use BigInt arithmetic to avoid precision loss
          const unclaimedRewards = BigInt(rewardPoolAmount) - BigInt(rewardsClaimed)

          processedReminders.push({
            id: i,
            action: "burned_missed_reminder",
            user,
            farcasterUsername: farcasterUsername || "wallet user",
            commitmentBurned: ethers.formatUnits(commitAmount, 18), // 30% of total (V4)
            rewardPoolTotal: ethers.formatUnits(rewardPoolAmount, 18), // 70% of total (V4)
            rewardsClaimed: ethers.formatUnits(rewardsClaimed, 18),
            rewardPoolReturned: ethers.formatUnits(unclaimedRewards, 18), // Unclaimed portion returned
            helpersCount: Number(totalReminders),
            deadline: deadlineDate,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
          })

          console.log(
            `[v0] Cron: Successfully burned reminder ${i} - Burned: ${ethers.formatUnits(commitAmount, 18)} tokens, Returned: ${ethers.formatUnits(unclaimedRewards, 18)} unclaimed rewards, tx: ${tx.hash}`
          )
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
