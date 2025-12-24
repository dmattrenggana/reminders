import { NextRequest, NextResponse } from 'next/server';

/**
 * Get Farcaster FID and user data from wallet address
 * Uses Neynar API endpoint directly: /v2/farcaster/user/bulk-by-address
 * Reference: https://docs.neynar.com/reference/fetch-user-information
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Gunakan endpoint yang benar dari Neynar
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('[API] Neynar response not ok:', response.status);
      return NextResponse.json({ fid: null, user: null });
    }

    const data = await response.json();
    
    // Response format: { "0x...address": [{ user object }] }
    const addressLower = address.toLowerCase();
    const users = data[addressLower] || data[address];
    
    if (users && users.length > 0) {
      const user = users[0]; // Ambil user pertama
      const userAny = user as any; // Type assertion for properties that may not be in type definition
      
      console.log('[API] User found:', {
        fid: user.fid,
        username: user.username,
        pfp_url: user.pfp_url,
      });
      
      // Return normalized user data with all fields used by hooks
      return NextResponse.json({
        fid: user.fid,
        user: {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name,
          displayName: user.display_name, // Alias for compatibility
          pfp_url: user.pfp_url,
          pfpUrl: user.pfp_url, // Alias for compatibility
          pfp: user.pfp_url, // Alias for compatibility
          bio: user.profile?.bio?.text || userAny.bio,
          profile: user.profile,
          custody_address: user.custody_address,
          verifications: user.verifications || [],
          verifiedAddresses: user.verifications || [], // Alias for compatibility
          verified_addresses: user.verified_addresses,
          verified_accounts: user.verified_accounts,
          follower_count: user.follower_count,
          following_count: user.following_count,
          power_badge: userAny.power_badge, // May not be in type definition but exists in API response
        }
      });
    }

    console.log('[API] No user found for address:', address);
    return NextResponse.json({ fid: null, user: null });
    
  } catch (error: any) {
    console.error('[API] Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error?.message }, 
      { status: 500 }
    );
  }
}
