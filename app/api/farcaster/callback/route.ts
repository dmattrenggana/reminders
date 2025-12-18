import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Get auth data from Warpcast callback
  const fid = searchParams.get('fid')
  const username = searchParams.get('username')
  const displayName = searchParams.get('displayName')
  const pfpUrl = searchParams.get('pfpUrl')
  const verifiedAddress = searchParams.get('verifiedAddress')
  
  // Redirect back to home with user data in URL params
  const redirectUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  
  if (fid) redirectUrl.searchParams.set('fid', fid)
  if (username) redirectUrl.searchParams.set('username', username)
  if (displayName) redirectUrl.searchParams.set('displayName', displayName)
  if (pfpUrl) redirectUrl.searchParams.set('pfpUrl', pfpUrl)
  if (verifiedAddress) redirectUrl.searchParams.set('verifiedAddress', verifiedAddress)
  
  return NextResponse.redirect(redirectUrl)
}
