import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

/**
 * Fetch Neynar User Quality Score by FID
 * Reference: https://docs.neynar.com/docs/getting-started-with-neynar
 * Reference: https://docs.neynar.com/docs/neynar-user-quality-score
 */
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

  // Initialize Neynar client according to official documentation
  // Reference: https://docs.neynar.com/docs/getting-started-with-neynar
  const config = new Configuration({
    apiKey: apiKey,
  });
  const client = new NeynarAPIClient(config);

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
    // DO NOT use manual calculation - must get from API
    const userAny = user as any;
    
    // Get score from profile.score (official Neynar User Quality Score)
    if (userAny.profile?.score === undefined || userAny.profile?.score === null) {
      return NextResponse.json({ 
        error: "Neynar User Quality Score not available",
        message: "Unable to fetch Neynar User Quality Score from API. Please try again later."
      }, { status: 500 });
    }
    
    const neynarScore = Number(userAny.profile.score);
    
    // Validate score is within valid range (0.0 to 1.0)
    if (isNaN(neynarScore) || neynarScore < 0 || neynarScore > 1) {
      return NextResponse.json({ 
        error: "Invalid Neynar User Quality Score",
        message: `Invalid score value: ${neynarScore}. Score must be between 0.0 and 1.0.`
      }, { status: 500 });
    }
    
    console.log(`[Neynar Score] Using official Neynar User Quality Score: ${neynarScore}`);
    
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
