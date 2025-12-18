import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackUrl = `${appUrl}/api/farcaster/callback`
  
  const warpcastUrl = `https://warpcast.com/~/sign-in-with-farcaster?redirect_uri=${encodeURIComponent(callbackUrl)}`
  
  return NextResponse.redirect(warpcastUrl)
}
