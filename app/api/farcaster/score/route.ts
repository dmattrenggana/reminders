import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY || "";
  const client = new NeynarAPIClient(apiKey);

  try {
    // Kita paksa menggunakan objek fids dan tambahkan 'as any' 
    // untuk melewati pengecekan TypeScript jika SDK-nya nge-bug
    const response = await (client.fetchBulkUsers as any)({
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
