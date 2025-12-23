/**
 * QuickNode Console API - Endpoints Management
 * 
 * GET: List all endpoints
 * POST: Create new endpoint
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
    const endpoints = await client.listEndpoints();

    // Filter for Base Mainnet if needed
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get("chain");
    const network = searchParams.get("network");

    let filteredEndpoints = endpoints;

    if (chain) {
      filteredEndpoints = filteredEndpoints.filter(
        (ep) => ep.chain?.toLowerCase() === chain.toLowerCase()
      );
    }

    if (network) {
      filteredEndpoints = filteredEndpoints.filter(
        (ep) => ep.network?.toLowerCase() === network.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      count: filteredEndpoints.length,
      endpoints: filteredEndpoints,
    });
  } catch (error: any) {
    console.error("[QuickNode API] Error listing endpoints:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch endpoints",
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

    const body = await request.json();
    const { chain, network, label } = body;

    if (!chain || !network) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          message: "chain and network are required",
        },
        { status: 400 }
      );
    }

    const client = createQuickNodeConsoleClient();
    
    // Create endpoint
    const endpoint = await client.createEndpoint({
      chain,
      network,
      label,
    });

    return NextResponse.json({
      success: true,
      endpoint,
      message: "Endpoint created successfully",
    });
  } catch (error: any) {
    console.error("[QuickNode API] Error creating endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to create endpoint",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
