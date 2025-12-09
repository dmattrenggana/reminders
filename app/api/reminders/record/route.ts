import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"

export async function POST(request: NextRequest) {
  try {
    const { reminderId, farcasterFid, walletAddress } = await request.json()

    // Get Neynar score for the user
    const neynarClient = new NeynarAPIClient({
      apiKey: process.env.FARCASTER_API_KEY!,
    })

    const userdata = await neynarClient.fetchBulkUsers([farcasterFid])
    const user = userdata.users[0]

    // Calculate score based on follower count and engagement
    const neynarScore = Math.max(1, Math.floor(user.follower_count / 10))

    // TODO: Call contract to record reminder with neynarScore
    // This would call: contract.recordReminder(reminderId, neynarScore)

    return NextResponse.json({
      success: true,
      neynarScore,
    })
  } catch (error) {
    console.error("Error recording reminder:", error)
    return NextResponse.json({ error: "Failed to record reminder" }, { status: 500 })
  }
}
