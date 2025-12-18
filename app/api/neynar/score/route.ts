import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID required" }, { status: 400 })
    }

    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Neynar API key not configured" }, { status: 500 })
    }

    const neynarClient = new NeynarAPIClient({ apiKey })
    const userdata = await neynarClient.fetchBulkUsers([Number(fid)])
    const user = userdata.users[0]

    // Calculate score based on follower count
    const score = Math.max(1, Math.floor(user.follower_count / 10))

    return NextResponse.json({ score, followerCount: user.follower_count })
  } catch (error) {
    console.error("Error fetching Neynar score:", error)
    return NextResponse.json({ error: "Failed to fetch score" }, { status: 500 })
  }
}
