/**
 * QuickNode Console API - Create Base Mainnet Endpoint
 * 
 * POST: Create Base Mainnet endpoint automatically
 * GET: Get or create Base Mainnet endpoint
 * 
 * Requires: QUICKNODE_CONSOLE_API_KEY environment variable
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
    
    // Try to find existing Base Mainnet endpoint
    let endpoint = await client.findBaseEndpoint();
    
    // If not found, create one
    if (!endpoint) {
      const searchParams = request.nextUrl.searchParams;
      const create = searchParams.get("create");
      
      if (create === "true") {
        endpoint = await client.createBaseEndpoint();
      } else {
        return NextResponse.json({
          success: true,
          found: false,
          message: "Base Mainnet endpoint not found. Use ?create=true to create one.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      found: true,
      endpoint: {
        id: endpoint.id,
        chain: endpoint.chain,
        network: endpoint.network,
        http_url: endpoint.http_url,
        wss_url: endpoint.wss_url,
        label: endpoint.label,
      },
    });
  } catch (error: any) {
    console.error("[QuickNode API] Error getting Base endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to get Base endpoint",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.QUICKNODE_CONSOLE_API_KEY) {
      return NextResponse.json(
        { error: "QuickNode Console API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { label } = body;

    const client = createQuickNodeConsoleClient();
    
    // Check if Base Mainnet endpoint already exists
    const existing = await client.findBaseEndpoint();
    if (existing) {
      return NextResponse.json({
        success: true,
        endpoint: {
          id: existing.id,
          chain: existing.chain,
          network: existing.network,
          http_url: existing.http_url,
          wss_url: existing.wss_url,
          label: existing.label,
        },
        message: "Base Mainnet endpoint already exists",
      });
    }

    // Create new Base Mainnet endpoint
    const endpoint = await client.createBaseEndpoint(label);

    return NextResponse.json({
      success: true,
      endpoint: {
        id: endpoint.id,
        chain: endpoint.chain,
        network: endpoint.network,
        http_url: endpoint.http_url,
        wss_url: endpoint.wss_url,
        label: endpoint.label,
      },
      message: "Base Mainnet endpoint created successfully",
    });
  } catch (error: any) {
    console.error("[QuickNode API] Error creating Base endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to create Base endpoint",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
