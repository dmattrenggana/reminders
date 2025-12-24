import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { 
  findPendingVerification, 
  markVerificationAsVerified 
} from "@/lib/utils/pending-verifications";
import { createRpcProvider } from "@/lib/utils/rpc-provider";
import { CONTRACTS, REMINDER_VAULT_ABI } from "@/lib/contracts/config";
import { ethers } from "ethers";

/**
 * Webhook endpoint untuk receive Neynar cast.created events
 * 
 * This endpoint is called by Neynar when a cast matching the webhook
 * subscription criteria is created.
 * 
 * URL: POST /api/webhooks/neynar-cast
 */
export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const body = await request.json();
    
    console.log('[Webhook] Received Neynar webhook:', {
      type: body.type,
      timestamp: new Date().toISOString(),
    });

    // Verify this is a cast.created event
    if (body.type !== 'cast.created') {
      console.log('[Webhook] Ignoring event type:', body.type);
      return NextResponse.json({ 
        success: true, 
        message: 'Event type not handled' 
      });
    }

    const cast = body.data;
    if (!cast) {
      console.warn('[Webhook] No cast data in webhook payload');
      return NextResponse.json({ 
        success: false, 
        error: 'No cast data' 
      }, { status: 400 });
    }

    const authorFid = cast.author?.fid;
    const castText = cast.text || '';
    const castHash = cast.hash;
    const castTimestamp = cast.timestamp ? new Date(cast.timestamp) : new Date();

    if (!authorFid) {
      console.warn('[Webhook] No author FID in cast data');
      return NextResponse.json({ 
        success: false, 
        error: 'No author FID' 
      }, { status: 400 });
    }

    console.log('[Webhook] Processing cast:', {
      hash: castHash,
      authorFid,
      text: castText.substring(0, 100),
    });

    // Extract mentioned FIDs (for matching with creator)
    const mentionedFids = cast.mentioned_profiles?.map((p: any) => p.fid) || [];
    
    // Find pending verification for this helper FID
    // We need to check all pending verifications since we don't know which reminder
    // For efficiency, we'll search by helper FID and then verify the cast content
    const { getAllPendingVerifications } = await import('@/lib/utils/pending-verifications');
    const allPendingVerifications = getAllPendingVerifications();
    
    const relevantPending = allPendingVerifications.filter(
      (v) => v.helperFid === authorFid && v.status === 'pending' && v.expiresAt > new Date()
    );

    if (relevantPending.length === 0) {
      console.log(`[Webhook] No pending verification found for helper FID ${authorFid}`);
      // This is okay - helper might not have clicked "Help to remind" yet
      return NextResponse.json({ 
        success: true, 
        message: 'No pending verification found' 
      });
    }

    // Verify each pending verification against this cast
    let verifiedCount = 0;
    
    for (const pending of relevantPending) {
      // Verify cast content matches verification requirements
      // Must have: mention creator + reminder keywords/app URL
      const mentionPattern = new RegExp(`@${pending.creatorUsername}`, 'i');
      // Match: "Tick-tock", "Don't forget", "Beat the clock", "approaching", or app URL
      const reminderPattern = new RegExp(
        `(Tick-tock|Don't forget|Beat the clock|approaching|remindersbase\\.vercel\\.app)`,
        'i'
      );
      
      const hasMention = mentionPattern.test(castText);
      const hasReminderContent = reminderPattern.test(castText);
      
      // Check if cast is recent (within last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const isRecent = castTimestamp > tenMinutesAgo;
      
      if (hasMention && hasReminderContent && isRecent) {
        console.log(`[Webhook] ✅ Cast matches verification requirements for reminder ${pending.reminderId}`);
        
        // Get Neynar User Quality Score
        const apiKey = process.env.NEYNAR_API_KEY || "";
        if (!apiKey) {
          console.error('[Webhook] NEYNAR_API_KEY not configured');
          continue; // Skip this verification, try next
        }
        
        try {
          const config = new Configuration({ apiKey });
          const neynarClient = new NeynarAPIClient(config);
          
          // Get user data and score
          const userdata = await neynarClient.fetchBulkUsers({ 
            fids: [authorFid] 
          });
          
          const user = userdata.users[0];
          if (!user) {
            console.warn(`[Webhook] User ${authorFid} not found in Neynar`);
            continue;
          }
          
          const userAny = user as any;
          const neynarScore = userAny.profile?.score;
          
          if (neynarScore === undefined || neynarScore === null) {
            console.warn(`[Webhook] Neynar score not available for user ${authorFid}`);
            continue;
          }
          
          const normalizedScore = Math.max(0, Math.min(1, Number(neynarScore)));
          
          // Calculate estimated reward
          let estimatedReward = "0";
          try {
            const provider = await createRpcProvider();
            if (provider) {
              const vaultContract = new ethers.Contract(
                CONTRACTS.REMINDER_VAULT,
                REMINDER_VAULT_ABI,
                provider
              );
              
              const reminder = await vaultContract.reminders(pending.reminderId);
              const rewardPoolAmount = reminder.rewardPoolAmount || BigInt(0);
              
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
            console.warn('[Webhook] Failed to calculate estimated reward:', contractError);
          }
          
          // Mark verification as verified
          const success = markVerificationAsVerified(pending.id, {
            neynarScore: normalizedScore,
            estimatedReward,
          });
          
          if (success) {
            verifiedCount++;
            console.log(`[Webhook] ✅ Successfully verified reminder ${pending.reminderId} for helper FID ${authorFid}`);
          }
        } catch (error: any) {
          console.error(`[Webhook] Error processing verification for reminder ${pending.reminderId}:`, error);
          // Continue to next pending verification
        }
      } else {
        console.log(`[Webhook] Cast does not match requirements for reminder ${pending.reminderId}`, {
          hasMention,
          hasReminderContent,
          isRecent,
        });
      }
    }

    // Always return 200 OK to Neynar (even if no match found)
    // This prevents Neynar from retrying the webhook
    return NextResponse.json({ 
      success: true,
      verified: verifiedCount,
      message: `Processed webhook, verified ${verifiedCount} pending verification(s)` 
    });

  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);
    
    // Still return 200 OK to prevent Neynar from retrying
    // Log error for monitoring
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
}

