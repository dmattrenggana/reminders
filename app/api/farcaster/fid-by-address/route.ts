import { NextRequest, NextResponse } from "next/server";

/**
 * Get Farcaster FID from wallet address
 * Uses Neynar API to lookup user by verified address
 * Reference: https://docs.neynar.com/reference/user-by-verification
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

  try {
    // Use Neynar API directly to lookup user by verification address
    // API endpoint: https://api.neynar.com/v2/farcaster/user/by_verification
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_verification?verification_address=${address}`,
      {
        method: "GET",
        headers: {
          "api_key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // If 404, user not found (not an error)
      if (response.status === 404) {
        return NextResponse.json({ 
          fid: null,
          user: null,
          message: "No Farcaster user found for this wallet address"
        });
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.result || !data.result.user) {
      return NextResponse.json({ 
        fid: null,
        user: null,
        message: "No Farcaster user found for this wallet address"
      });
    }

    const user = data.result.user;
    
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
    if (error.message?.includes("not found") || error.message?.includes("404")) {
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
