import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  // Gunakan API Key dari env atau string kosong sebagai fallback
  const apiKey = process.env.NEYNAR_API_KEY || "";
  const client = new NeynarAPIClient(apiKey);

  try {
    // Perbaikan: Bungkus FID ke dalam objek dengan properti 'fids'
    const response = await client.fetchBulkUsers({
      fids: [Number.parseInt(fid)]
    });

    if (!response.users || response.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = response.users[0];
    return NextResponse.json({
      score: user.profile?.bio || "No bio",
      followerCount: user.follower_count,
    });
  } catch (error) {
    console.error("Neynar API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
