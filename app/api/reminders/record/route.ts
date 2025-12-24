import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { CONTRACTS, REMINDER_VAULT_ABI } from "@/lib/contracts/config";
import { createRpcProvider } from "@/lib/utils/rpc-provider";
import { ethers } from "ethers";
import { createPendingVerification, findPendingVerification } from "@/lib/utils/pending-verifications";

/**
 * Verify helper post via Neynar API
 */
async function verifyHelperPost(
  neynarClient: NeynarAPIClient,
  helperFid: number,
  creatorUsername: string,
  reminderId: number
): Promise<boolean> {
  try {
    // Get recent casts from helper (last 20)
    const casts = await neynarClient.fetchCastsForUser({
      fid: helperFid,
      limit: 20
    });

    // Check if any cast mentions creator and contains reminder keywords or app URL
    const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
    // Look for mention + reminder keywords OR mention + app URL
    const reminderPattern = new RegExp(
      `remindersbase\\.vercel\\.app|Tick-tock|Beat the clock|approaching`,
      'i'
    );

    for (const cast of casts.casts) {
      const text = cast.text;
      const hasMention = mentionPattern.test(text);
      const hasReminderContent = reminderPattern.test(text);
      
      if (hasMention && hasReminderContent) {
        // Check if cast is recent (within last 10 minutes to allow for posting time)
        const castTime = new Date(cast.timestamp);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (castTime > tenMinutesAgo) {
          console.log(`[Verify] ✅ Post verified: Found cast with mention and reminder content`, {
            castText: text.substring(0, 100),
            castTime: castTime.toISOString(),
          });
          return true; // ✅ Verified!
        }
      }
    }

    console.log(`[Verify] ❌ No valid post found for helper ${helperFid} mentioning @${creatorUsername}`);
    return false; // ❌ No valid post found
  } catch (error: any) {
    console.error("[Verify] Verify post error:", error);
    // Log detailed error for debugging
    console.error("[Verify] Error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    return false; // Graceful fallback - don't allow if API error (strict verification)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId, helperAddress, helperFid, creatorUsername, useWebhook } = body;

    if (!reminderId || !helperAddress || !helperFid) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required parameters",
        message: "reminderId, helperAddress, and helperFid are required" 
      }, { status: 400 });
    }

    const apiKey = process.env.NEYNAR_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ 
        success: false,
        error: "Server configuration error",
        message: "NEYNAR_API_KEY not configured" 
      }, { status: 500 });
    }

    // Initialize Neynar client according to official documentation
    // Reference: https://docs.neynar.com/docs/getting-started-with-neynar
    const config = new Configuration({
      apiKey: apiKey,
    });
    const neynarClient = new NeynarAPIClient(config);

    // WEBHOOK MODE (PRIMARY): Create pending verification and return token
    // Webhook mode is now the default for real-time verification
    // Frontend will poll /api/verifications/[token] to check status
    // If useWebhook is not explicitly false, default to webhook mode
    const shouldUseWebhook = useWebhook !== false && creatorUsername;
    
    if (shouldUseWebhook) {
      console.log(`[Record] Using webhook mode (PRIMARY) for helper ${helperFid}, reminder ${reminderId}`);
      
      // Check if there's already a pending verification
      const existing = findPendingVerification(Number(helperFid), parseInt(reminderId));
      
      if (existing && existing.status === 'pending' && existing.expiresAt > new Date()) {
        console.log(`[Record] Found existing pending verification: ${existing.id}`);
        return NextResponse.json({
          success: true,
          verification_token: existing.id,
          status: 'pending',
          message: 'Pending verification already exists. Waiting for webhook...',
        });
      }
      
      // Create new pending verification
      const verification = createPendingVerification({
        reminderId: parseInt(reminderId),
        helperFid: Number(helperFid),
        helperAddress,
        creatorUsername,
        expiresInMinutes: 10, // 10 minutes to post and get webhook
      });
      
      console.log(`[Record] ✅ Created pending verification ${verification.id} for webhook mode (PRIMARY)`);
      
      return NextResponse.json({
        success: true,
        verification_token: verification.id,
        status: 'pending',
        message: 'Pending verification created. Waiting for webhook notification...',
      });
    }

    // POLLING MODE (default): Verify post immediately via Neynar API
    // Step 1: Verify post if creatorUsername provided
    if (creatorUsername) {
      console.log(`[Record] Using polling mode - verifying post for helper ${helperFid}, creator @${creatorUsername}, reminder ${reminderId}`);
      const hasPosted = await verifyHelperPost(
        neynarClient,
        Number(helperFid),
        creatorUsername,
        parseInt(reminderId)
      );

      if (!hasPosted) {
        console.log(`[Record] ❌ Post verification failed for helper ${helperFid}`);
        return NextResponse.json({ 
          success: false,
          error: "Post verification failed",
          message: "Please post a mention of the creator (@username) with reminder keywords (Tick-tock, Beat the clock, approaching, or app URL) before claiming reward. Make sure your post is recent (within last 10 minutes)."
        }, { status: 400 });
      }
      console.log(`[Record] ✅ Post verified for helper ${helperFid}`);
    } else {
      console.log(`[Record] ⚠️ Skipping post verification - creatorUsername not provided`);
    }

    // Step 2: Get Neynar User Quality Score
    // According to Neynar docs: https://docs.neynar.com/docs/neynar-user-quality-score
    // Score is available in user.profile.score (0.0 to 1.0 range)
    // Score is calculated weekly based on user activity on the network
    const userdata = await neynarClient.fetchBulkUsers({ 
      fids: [Number(helperFid)] 
    });
    
    const user = userdata.users[0];
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "User not found",
        message: "Farcaster user not found. Please ensure your FID is correct."
      }, { status: 404 });
    }

    // Get Neynar User Quality Score from API
    // According to Neynar docs: https://docs.neynar.com/docs/neynar-user-quality-score
    // Score is in user.profile.score (0.0 to 1.0)
    // Score is calculated weekly based on user activity
    // DO NOT use manual calculation - must get from API
    const userAny = user as any;
    
    // Get score from profile.score (official Neynar User Quality Score)
    if (userAny.profile?.score === undefined || userAny.profile?.score === null) {
      return NextResponse.json({ 
        success: false,
        error: "Neynar User Quality Score not available",
        message: "Unable to fetch Neynar User Quality Score from API. Please try again later."
      }, { status: 500 });
    }
    
    const neynarScore = Number(userAny.profile.score);
    
    // Validate score is within valid range (0.0 to 1.0)
    if (isNaN(neynarScore) || neynarScore < 0 || neynarScore > 1) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid Neynar User Quality Score",
        message: `Invalid score value: ${neynarScore}. Score must be between 0.0 and 1.0.`
      }, { status: 500 });
    }
    
    console.log(`[Record] ✅ Using Neynar User Quality Score from API: ${neynarScore}`);
    
    // Normalize to 0-1 range (ensure it's within bounds)
    const normalizedScore = Math.max(0, Math.min(1, neynarScore));
    
    console.log(`[Record] Normalized score: ${normalizedScore}`);

    // Step 3: Get reminder data from contract to calculate estimated reward
    let estimatedReward = "0";
    try {
      const provider = await createRpcProvider();
      if (provider) {
        const vaultContract = new ethers.Contract(
          CONTRACTS.REMINDER_VAULT,
          REMINDER_VAULT_ABI,
          provider
        );
        
        const reminder = await vaultContract.reminders(reminderId);
        const rewardPoolAmount = reminder.rewardPoolAmount || BigInt(0);
        
        // Calculate reward based on tier (V4 contract logic)
        let rewardPercentage = 300; // 3% default (TIER_LOW)
        const scorePercent = Math.floor(normalizedScore * 100);
        if (scorePercent >= 90) {
          rewardPercentage = 1000; // 10% (TIER_HIGH)
        } else if (scorePercent >= 50) {
          rewardPercentage = 600; // 6% (TIER_MEDIUM)
        }
        
        const rewardAmount = (rewardPoolAmount * BigInt(rewardPercentage)) / BigInt(10000);
        estimatedReward = ethers.formatUnits(rewardAmount, 18);
      }
    } catch (contractError) {
      console.warn("Failed to calculate estimated reward:", contractError);
      // Continue anyway - reward calculation is optional
    }

    console.log(`[Record] ✅ Verification complete for reminder ${reminderId}, helper ${helperFid}`);
    console.log(`[Record] Response data:`, {
      success: true,
      neynarScore: normalizedScore,
      estimatedReward: estimatedReward,
      username: user.username,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Reminder verified and ready to record",
      neynarScore: normalizedScore,
      estimatedReward: estimatedReward,
      user: user.username 
    });

  } catch (error: any) {
    console.error("Record Reminder Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        message: error.message || "Failed to process reminder record"
      },
      { status: 500 }
    );
  }
}
