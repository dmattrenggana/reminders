import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"
import { CONTRACTS, REMINDER_VAULT_V2_ABI } from "@/lib/contracts/config"

export async function POST(request: NextRequest) {
  try {
    const { reminderId, farcasterFid, walletAddress } = await request.json()

    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Neynar API key not configured" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || !process.env.CRON_WALLET_PRIVATE_KEY) {
      return NextResponse.json({ error: "Missing required environment variables" }, { status: 500 })
    }

    const neynarClient = new NeynarAPIClient({ apiKey })
    const userdata = await neynarClient.fetchBulkUsers([farcasterFid])
    const user = userdata.users[0]

    // Calculate score based on follower count
    const neynarScore = Math.max(1, Math.floor(user.follower_count / 10))

    const { ethers } = await import("ethers")
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL)
    const wallet = new ethers.Wallet(process.env.CRON_WALLET_PRIVATE_KEY, provider)
    const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, wallet)

    const tx = await vaultContract.recordReminder(reminderId, neynarScore)
    const receipt = await tx.wait()

    const rewardClaimedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = vaultContract.interface.parseLog(log)
        return parsed?.name === "RewardClaimed"
      } catch {
        return false
      }
    })

    let rewardAmount = 0
    if (rewardClaimedEvent) {
      const parsed = vaultContract.interface.parseLog(rewardClaimedEvent)
      rewardAmount = parsed?.args?.amount ? Number(ethers.formatEther(parsed.args.amount)) : 0
    }

    return NextResponse.json({
      success: true,
      neynarScore,
      rewardAmount,
      txHash: tx.hash,
    })
  } catch (error) {
    console.error("Error recording reminder:", error)
    return NextResponse.json({ error: "Failed to record reminder" }, { status: 500 })
  }
}
