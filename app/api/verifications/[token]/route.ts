import { NextRequest, NextResponse } from "next/server";
import { getPendingVerificationById } from "@/lib/utils/pending-verifications";

/**
 * Get verification status by token
 * 
 * Frontend can poll this endpoint to check if verification is complete
 * (fallback if webhook is not received in time)
 * 
 * URL: GET /api/verifications/[token]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const params = await context.params;
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    const verification = getPendingVerificationById(token);

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    // Return verification status
    return NextResponse.json({
      status: verification.status,
      reminderId: verification.reminderId,
      helperFid: verification.helperFid,
      createdAt: verification.createdAt.toISOString(),
      expiresAt: verification.expiresAt.toISOString(),
      verifiedAt: verification.verifiedAt?.toISOString(),
      // Include verification data if verified
      ...(verification.status === 'verified' && {
        neynarScore: verification.neynarScore,
        estimatedReward: verification.estimatedReward,
      }),
    });
  } catch (error: any) {
    console.error('[VerificationStatus] Error:', error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
