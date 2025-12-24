import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

/**
 * Get Farcaster FID from wallet address
 * Uses Neynar API to lookup user by verified address
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
    // Fetch user by wallet address
    const response = await client.lookupUserByVerification(address as `0x${string}`);
    
    if (!response || !response.result) {
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
        verifiedAddresses: user.verified_addresses
      }
    });
  } catch (error: any) {
    console.error("Neynar lookup error:", error);
    
    // If user not found, return null (not an error)
    if (error.message?.includes("not found") || error.status === 404) {
      return NextResponse.json({ 
        fid: null,
        user: null,
        message: "No Farcaster user found for this wallet address"
      });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch Farcaster user", details: error.message },
      { status: 500 }
    );
  }
}
