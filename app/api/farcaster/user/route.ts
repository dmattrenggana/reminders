import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Neynar API key not configured" }, { status: 500 })
    }

    const client = new NeynarAPIClient({ apiKey })

    const response = await client.fetchBulkUsers([Number.parseInt(fid)])

    if (!response.users || response.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = response.users[0]

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || "/abstract-profile.png",
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      verified: user.verified_addresses?.eth_addresses?.length > 0,
    })
  } catch (error) {
    console.error("Error fetching Neynar user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
