import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }

    // Fetch user data from Neynar using the FID
    const neynarApiKey = process.env.NEYNAR_API_KEY
    if (!neynarApiKey) {
      console.error("NEYNAR_API_KEY not configured")
      return NextResponse.redirect(new URL("/?error=config_error", request.url))
    }

    const client = new NeynarAPIClient(neynarApiKey)
    const userResponse = await client.fetchBulkUsers([Number.parseInt(fid)])

    if (!userResponse.users || userResponse.users.length === 0) {
      return NextResponse.redirect(new URL("/?error=user_not_found", request.url))
    }

    const user = userResponse.users[0]

    // Build the redirect URL with user data in query params
    const redirectUrl = new URL("/", request.url)
    redirectUrl.searchParams.set("farcaster_fid", user.fid.toString())
    redirectUrl.searchParams.set("farcaster_username", user.username)
    redirectUrl.searchParams.set("farcaster_display_name", user.display_name || user.username)
    redirectUrl.searchParams.set("farcaster_pfp", user.pfp_url || "")
    if (user.verified_addresses?.eth_addresses?.[0]) {
      redirectUrl.searchParams.set("farcaster_address", user.verified_addresses.eth_addresses[0])
    }

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("Error in Farcaster callback:", error)
    return NextResponse.redirect(new URL("/?error=callback_failed", request.url))
  }
}
