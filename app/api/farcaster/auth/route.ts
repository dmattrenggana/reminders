import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/farcaster/callback`
  
  // Redirect to Warpcast for Farcaster sign-in
  const warpcastUrl = `https://warpcast.com/~/signin?redirect_uri=${encodeURIComponent(redirectUrl)}`
  
  return NextResponse.redirect(warpcastUrl)
}
