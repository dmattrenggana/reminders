import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { CONTRACTS, REMINDER_VAULT_V2_ABI } from "@/lib/contracts/config"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.BASE_SEPOLIA_RPC_URL || !process.env.CRON_WALLET_PRIVATE_KEY) {
      return NextResponse.json({ error: "Missing required environment variables" }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL)
    const wallet = new ethers.Wallet(process.env.CRON_WALLET_PRIVATE_KEY, provider)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, wallet)

    const currentTime = Math.floor(Date.now() / 1000)
    const processedReminders = []
    const errors = []

    const reminderCount = await vaultContract.nextReminderId()

    for (let i = 0; i < Number(reminderCount); i++) {
      try {
        const reminder = await vaultContract.getReminder(i)
        const [
          user,
          commitmentAmount,
          rewardPoolAmount,
          reminderTime,
          confirmationDeadline,
          confirmed,
          burned,
          description,
          totalReminders,
        ] = reminder

        if (confirmed || burned) continue

        if (currentTime > Number(confirmationDeadline)) {
          const shouldBurn = await vaultContract.shouldBurn(i)

          if (shouldBurn) {
            // Burns commitment tokens and returns unclaimed reward pool to user
            const tx = await vaultContract.burnMissedReminder(i)
            await tx.wait()

            processedReminders.push({
              id: i,
              action: "burned_and_returned",
              user,
              commitmentBurned: ethers.formatUnits(commitmentAmount, 18),
              rewardPoolReturned: ethers.formatUnits(rewardPoolAmount, 18),
              txHash: tx.hash,
            })
          }
        }
      } catch (error: any) {
        errors.push({
          id: i,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: processedReminders.length,
      reminders: processedReminders,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed", message: error.message }, { status: 500 })
  }
}
