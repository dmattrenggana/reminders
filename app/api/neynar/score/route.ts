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

    // Get Neynar User Quality Score from API
    // According to Neynar docs: https://docs.neynar.com/docs/neynar-user-quality-score
    // Score is available in user.profile.score (0.0 to 1.0 range)
    // Score is calculated weekly based on user activity on the network
    let neynarScore = 0;
    const userAny = user as any;
    
    // Try to get score from profile.score (official Neynar User Quality Score)
    if (userAny.profile?.score !== undefined && userAny.profile?.score !== null) {
      neynarScore = Number(userAny.profile.score);
      console.log(`[Neynar Score] Using official Neynar User Quality Score: ${neynarScore}`);
    } else {
      // Fallback: Calculate score manually
      // Power badge users get high score (0.9-1.0)
      // Others based on follower count with diminishing returns
      if (userAny.power_badge) {
        neynarScore = 0.95; // Power badge = premium users
      } else {
        // Logarithmic scale for followers (diminishing returns)
        // 100 followers = ~0.4, 1000 = ~0.6, 10000 = ~0.8
        const followerCount = user.follower_count || 0;
        neynarScore = Math.min(Math.log10(followerCount + 1) / 5, 0.89);
      }
      console.log(`[Neynar Score] Using calculated score (fallback): ${neynarScore}`);
    }

    // Normalize to 0-1 range (ensure it's within bounds)
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
