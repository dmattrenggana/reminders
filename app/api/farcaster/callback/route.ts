import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fid = searchParams.get('fid')
  const username = searchParams.get('username')
  const displayName = searchParams.get('display_name')
  const pfpUrl = searchParams.get('pfp_url')
  const verifiedAddress = searchParams.get('verified_address')
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUrl = new URL(appUrl)
  
  if (fid && username) {
    redirectUrl.searchParams.set('fid', fid)
    redirectUrl.searchParams.set('username', username)
    if (displayName) redirectUrl.searchParams.set('displayName', displayName)
    if (pfpUrl) redirectUrl.searchParams.set('pfpUrl', pfpUrl)
    if (verifiedAddress) redirectUrl.searchParams.set('verifiedAddress', verifiedAddress)
  }
  
  return NextResponse.redirect(redirectUrl)
}
