/**
 * QuickNode Console API - Get Usage Statistics
 * 
 * Get RPC usage statistics from QuickNode Console API
 */

import { NextRequest, NextResponse } from "next/server";
import { createQuickNodeConsoleClient } from "@/lib/utils/quicknode-console";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.QUICKNODE_CONSOLE_API_KEY) {
      return NextResponse.json(
        { error: "QuickNode Console API key not configured" },
        { status: 500 }
      );
    }

    const client = createQuickNodeConsoleClient();
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || undefined;

    const usage = await client.getUsage(period);

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error: any) {
    console.error("[QuickNode API] Error fetching usage:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch usage statistics",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
