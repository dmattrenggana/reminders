import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

/**
 * Fetch Farcaster user data by FID (legacy endpoint, use /api/farcaster/user instead)
 * Reference: https://docs.neynar.com/docs/getting-started-with-neynar
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

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
    // According to Neynar docs: fids parameter must be a comma-separated string, not an array
    // Note: TypeScript types may show array, but actual API expects comma-separated string
    const users = await client.fetchBulkUsers({ 
      fids: fid as any // Comma-separated string (TypeScript types may be incorrect)
    });
    
    return NextResponse.json({ 
      score: users.users[0] || null 
    });
  } catch (error) {
    console.error("Neynar Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch score" },
      { status: 500 }
    );
  }
}
