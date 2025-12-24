import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

/**
 * Get Farcaster FID and user data from wallet address
 * Uses Neynar SDK fetchBulkUsersByEthOrSolAddress method
 * Reference: https://docs.neynar.com/docs/getting-started-with-neynar
 * Reference: https://docs.neynar.com/docs/fetching-farcaster-user-based-on-ethereum-address
 * 
 * Response structure: User[] (array of User objects)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
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
    // Use Neynar SDK method: fetchBulkUsersByEthOrSolAddress
    // This is the correct method according to Neynar documentation
    // addresses parameter requires an array of strings
    // Response structure: array of users (User[])
    const response = await client.fetchBulkUsersByEthOrSolAddress({
      addresses: [address], // Array of addresses (single address in array)
    });

    // Response is an array of users - get first user if available
    if (!response || !Array.isArray(response) || response.length === 0) {
      return NextResponse.json({ 
        fid: null,
        user: null,
        message: "No Farcaster user found for this wallet address"
      });
    }

    const user = response[0]; // Get first user from array
    
    // Return normalized user data according to Neynar user structure
    return NextResponse.json({ 
      fid: user.fid,
      user: {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        displayName: user.display_name, // Alias for compatibility
        pfp_url: user.pfp_url,
        pfpUrl: user.pfp_url, // Alias for compatibility
        custody_address: user.custody_address,
        profile: user.profile,
        follower_count: user.follower_count,
        following_count: user.following_count,
        verifications: user.verifications || [],
        verified_addresses: user.verified_addresses,
        verified_accounts: user.verified_accounts,
        power_badge: user.power_badge,
        bio: user.profile?.bio?.text || user.bio,
        verifiedAddresses: user.verifications || [] // Alias for compatibility
      }
    });
  } catch (error: any) {
    console.error("Neynar lookup error:", error);
    
    // If user not found, return null (not an error)
    // Neynar SDK may throw error if user not found
    if (error.message?.includes("not found") || 
        error.message?.includes("404") ||
        error.response?.status === 404 ||
        error.status === 404) {
      return NextResponse.json({ 
        fid: null,
        user: null,
        message: "No Farcaster user found for this wallet address"
      });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch Farcaster user", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
