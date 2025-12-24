import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import { 
  getPendingVerificationById, 
  markVerificationAsVerified 
} from '@/lib/supabase/verification-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { verificationToken } = await request.json();
    
    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Verification token required' },
        { status: 400 }
      );
    }

    // Get pending verification from Supabase
    const verification = await getPendingVerificationById(verificationToken);
    
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    if (verification.status !== 'pending') {
      return NextResponse.json({
        success: verification.status === 'verified',
        status: verification.status,
        message: `Verification already ${verification.status}`,
        neynarScore: verification.neynar_score,
        estimatedReward: verification.estimated_reward,
      });
    }

    // Initialize Neynar client
    const apiKey = process.env.NEYNAR_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NEYNAR_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new NeynarAPIClient(new Configuration({ apiKey }));

    // Fetch helper's recent casts (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    let helperCasts: any[] = [];
    try {
      const response = await client.fetchCastsForUser({
        fid: verification.helper_fid,
        limit: 25, // Check last 25 casts
      });
      
      helperCasts = response.casts || [];
    } catch (error: any) {
      console.error('[VerifyPost] Error fetching casts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user casts from Neynar' },
        { status: 500 }
      );
    }

    // Verify post content
    const mentionPattern = new RegExp(`@${verification.creator_username}`, 'i');
    const reminderPattern = new RegExp(
      `(Tick-tock|Don't forget|Beat the clock|approaching|remindersbase\\.vercel\\.app)`,
      'i'
    );

    let verifiedCast = null;
    for (const cast of helperCasts) {
      const castTime = new Date(cast.timestamp);
      
      // Must be recent (within last 10 minutes)
      if (castTime < tenMinutesAgo) {
        continue;
      }

      const castText = cast.text || '';
      const hasMention = mentionPattern.test(castText);
      const hasReminderContent = reminderPattern.test(castText);

      if (hasMention && hasReminderContent) {
        verifiedCast = cast;
        break;
      }
    }

    if (!verifiedCast) {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'No matching post found yet. Please ensure you mentioned the creator and included reminder keywords.',
      });
    }

    // Calculate Neynar score
    let neynarScore = 0.5; // Default
    try {
      const userResponse = await client.fetchBulkUsers({ 
        fids: `${verification.helper_fid}` 
      });
      const users = userResponse.users || [];
      
      if (users.length > 0 && (users[0] as any).profile?.score) {
        neynarScore = (users[0] as any).profile.score;
      }
    } catch (error) {
      console.warn('[VerifyPost] Could not fetch Neynar score, using default');
    }

    // Calculate estimated reward (simplified - should match contract logic)
    const estimatedReward = (neynarScore * 0.7).toFixed(4); // Example calculation

    // Update Supabase
    const updated = await markVerificationAsVerified(verificationToken, {
      neynarScore,
      estimatedReward,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'verified',
      neynarScore,
      estimatedReward,
      castHash: verifiedCast.hash,
      message: 'Post verified successfully!',
    });

  } catch (error: any) {
    console.error('[VerifyPost] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

