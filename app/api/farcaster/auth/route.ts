import { type NextRequest, NextResponse } from "next/server"

export async function POST() {
  try {
    // Generate a SIWF URL that redirects to our callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectUri = `${appUrl}/api/farcaster/callback`

    // Build the Warpcast SIWF URL
    const siweUrl = new URL("https://warpcast.com/~/sign-in-with-farcaster")
    siweUrl.searchParams.set("redirect_uri", redirectUri)

    return NextResponse.json({ authUrl: siweUrl.toString() })
  } catch (error) {
    console.error("Error generating Farcaster auth URL:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Same as POST for direct browser access
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectUri = `${appUrl}/api/farcaster/callback`

    const siweUrl = new URL("https://warpcast.com/~/sign-in-with-farcaster")
    siweUrl.searchParams.set("redirect_uri", redirectUri)

    // Redirect directly to Warpcast
    return NextResponse.redirect(siweUrl.toString())
  } catch (error) {
    console.error("Error in Farcaster auth:", error)
    return NextResponse.json({ error: "Auth failed" }, { status: 500 })
  }
}
