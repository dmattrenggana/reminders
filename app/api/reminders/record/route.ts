import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { CONTRACTS, REMINDER_VAULT_ABI } from "@/lib/contracts/config";
import { createRpcProvider } from "@/lib/utils/rpc-provider";
import { ethers } from "ethers";

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

    // Check if any cast mentions creator and reminder
    const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
    const reminderPattern = new RegExp(`#${reminderId}|reminder.*${reminderId}`, 'i');

    for (const cast of casts.casts) {
      const text = cast.text.toLowerCase();
      if (mentionPattern.test(text) && reminderPattern.test(text)) {
        // Check if cast is recent (within last hour)
        const castTime = new Date(cast.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (castTime > oneHourAgo) {
          return true; // ✅ Verified!
        }
      }
    }

    return false; // ❌ No valid post found
  } catch (error) {
    console.error("Verify post error:", error);
    return false; // Graceful fallback - allow if API error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId, helperAddress, helperFid, creatorUsername } = body;

    if (!reminderId || !helperAddress || !helperFid) {
      return NextResponse.json({ 
        error: "reminderId, helperAddress, and helperFid are required" 
      }, { status: 400 });
    }

    const apiKey = process.env.NEYNAR_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ 
        error: "NEYNAR_API_KEY not configured" 
      }, { status: 500 });
    }

    const neynarClient = new NeynarAPIClient({ apiKey });

    // Step 1: Verify post if creatorUsername provided
    if (creatorUsername) {
      const hasPosted = await verifyHelperPost(
        neynarClient,
        Number(helperFid),
        creatorUsername,
        parseInt(reminderId)
      );

      if (!hasPosted) {
        return NextResponse.json({ 
          success: false,
          error: "Post verification failed",
          message: "Please post a mention of the creator with the reminder ID before claiming reward"
        }, { status: 400 });
      }
    }

    // Step 2: Get Neynar score
    const userdata = await neynarClient.fetchBulkUsers({ 
      fids: [Number(helperFid)] 
    });
    
    const user = userdata.users[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate Neynar score (0-1 range) - same logic as app/api/neynar/score/route.ts
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
