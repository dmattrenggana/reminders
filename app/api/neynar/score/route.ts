import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json({ error: "Neynar API key not configured" }, { status: 500 });
  }

  const client = new NeynarAPIClient({ apiKey });

  try {
    const response = await client.fetchBulkUsers({ 
      fids: [parseInt(fid)] 
    });

    const user = response.users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate Neynar score (0-1 range)
    // Power badge users get high score (0.9-1.0)
    // Others based on follower count with diminishing returns
    let neynarScore = 0;
    
    // Type assertion untuk power_badge (optional property)
    const userWithPowerBadge = user as any;
    if (userWithPowerBadge.power_badge) {
      neynarScore = 0.95; // Power badge = premium users
    } else {
      // Logarithmic scale for followers (diminishing returns)
      // 100 followers = ~0.4, 1000 = ~0.6, 10000 = ~0.8
      const followerCount = user.follower_count || 0;
      neynarScore = Math.min(Math.log10(followerCount + 1) / 5, 0.89);
    }

    // Normalize to 0-1 range
    const normalizedScore = Math.max(0, Math.min(1, neynarScore));

    return NextResponse.json({ 
      score: normalizedScore,
      rawScore: neynarScore,
      user: {
        fid: user.fid,
        username: user.username,
        pfp: user.pfp_url,
        followerCount: user.follower_count,
        powerBadge: (user as any).power_badge
      }
    });
  } catch (error: any) {
    console.error("Neynar Score Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch score", details: error.message },
      { status: 500 }
    );
  }
}
