import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")
    const address = searchParams.get("address")

    if (!fid && !address) {
      return NextResponse.json({ error: "FID or address is required" }, { status: 400 })
    }

    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Neynar API key not configured" }, { status: 500 })
    }

    const client = new NeynarAPIClient({ apiKey })

    let user

    if (fid) {
      const response = await client.fetchBulkUsers([Number.parseInt(fid)])
      if (!response.users || response.users.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      user = response.users[0]
    } else if (address) {
      // Search for user by verified address
      const response = await client.searchUser(address, 1)
      if (!response.result || !response.result.users || response.result.users.length === 0) {
        return NextResponse.json({ error: "User not found for address" }, { status: 404 })
      }
      user = response.result.users[0]
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const walletAddress =
      user.custody_address || user.verified_addresses?.eth_addresses?.[0] || user.verified_addresses?.sol_addresses?.[0]

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || "/abstract-profile.png",
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      verified: user.verified_addresses?.eth_addresses?.length > 0,
      custodyAddress: user.custody_address,
      walletAddress: walletAddress,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
    })
  } catch (error) {
    console.error("Error fetching Neynar user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
