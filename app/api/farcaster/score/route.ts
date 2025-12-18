import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  // Perbaikan konfigurasi Neynar untuk Next.js 15
  const apiKey = process.env.NEYNAR_API_KEY || "";
  const client = new NeynarAPIClient({ apiKey }); 

  try {
    const fids = [parseInt(fid)];
    // Menggunakan user bulk untuk mendapatkan skor/data user
    const users = await client.fetchBulkUsers({ fids });
    
    return NextResponse.json({ 
      score: users.users[0] || null 
    });
  } catch (error) {
    console.error("Neynar Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch score" },
      { status: 500 }
    );
  }
}
