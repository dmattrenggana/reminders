import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

/**
 * Fetch Farcaster user data by FID using Neynar SDK
 * Reference: https://docs.neynar.com/docs/getting-started-with-neynar
 * 
 * Example response structure:
 * {
 *   users: [{
 *     object: 'user',
 *     fid: 3,
 *     username: 'dwr.eth',
 *     display_name: 'Dan Romero',
 *     pfp_url: 'https://...',
 *     custody_address: '0x...',
 *     profile: {...},
 *     follower_count: 489109,
 *     following_count: 3485,
 *     verifications: [...],
 *     verified_addresses: {...},
 *     verified_accounts: [...],
 *     power_badge: true
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");
  const viewerFid = searchParams.get("viewerFid"); // Optional: FID of the viewer

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json({ error: "NEYNAR_API_KEY not configured" }, { status: 500 });
  }

  // Initialize Neynar client according to official documentation
  // Reference: https://docs.neynar.com/docs/getting-started-with-neynar
  const config = new Configuration({
    apiKey: apiKey,
  });
  const client = new NeynarAPIClient(config);

  try {
    // Fetch user data by FID
    // According to Neynar docs: fetchBulkUsers({ fids, viewerFid })
    // fids parameter must be a comma-separated string, not an array
    // Note: TypeScript types may show array, but actual API expects comma-separated string
    const response = await client.fetchBulkUsers({ 
      fids: fid as any, // Comma-separated string (TypeScript types may be incorrect)
      viewerFid: viewerFid ? parseInt(viewerFid) : undefined
    });

    // Response structure: { users: User[] }
    if (!response.users || response.users.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        message: `No Farcaster user found with FID: ${fid}`
      }, { status: 404 });
    }

    const user = response.users[0];
    const userAny = user as any; // Type assertion for properties that may not be in type definition
    
    // Return user data in a normalized format
    return NextResponse.json({ 
      user: {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        custody_address: user.custody_address,
        profile: user.profile,
        follower_count: user.follower_count,
        following_count: user.following_count,
        verifications: user.verifications || [],
        verified_addresses: user.verified_addresses,
        verified_accounts: user.verified_accounts,
        power_badge: userAny.power_badge, // May not be in type definition but exists in API response
        bio: user.profile?.bio?.text || userAny.bio,
      }
    });
  } catch (error: any) {
    console.error("[Neynar] Error fetching user by FID:", error);
    
    // Handle specific error cases
    if (error.message?.includes("not found") || 
        error.message?.includes("404") ||
        error.response?.status === 404 ||
        error.status === 404) {
      return NextResponse.json({ 
        error: "User not found",
        message: `No Farcaster user found with FID: ${fid}`
      }, { status: 404 });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch user data",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
