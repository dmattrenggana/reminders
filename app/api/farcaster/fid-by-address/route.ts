import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

/**
 * Get Farcaster FID from wallet address
 * Uses Neynar SDK fetchBulkUsersByEthOrSolAddress method
 * Reference: https://docs.neynar.com/docs/fetching-farcaster-user-based-on-ethereum-address
 * Reference: https://docs.neynar.com/nodejs-sdk/user-apis/fetchBulkUsersByEthOrSolAddress
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

  const client = new NeynarAPIClient({ apiKey });

  try {
    // Use Neynar SDK method: fetchBulkUsersByEthOrSolAddress
    // This is the correct method according to Neynar documentation
    // addresses parameter requires an array of strings
    const response = await client.fetchBulkUsersByEthOrSolAddress({
      addresses: [address], // Array of addresses (single address in array)
    });

    // Response structure: { result: { user: { fid, username, displayName, pfp_url, ... } } }
    if (!response || !response.result || !response.result.user) {
      return NextResponse.json({ 
        fid: null,
        user: null,
        message: "No Farcaster user found for this wallet address"
      });
    }

    const user = response.result.user;
    
    return NextResponse.json({ 
      fid: user.fid,
      user: {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        verifiedAddresses: user.verifications || []
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
