import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY || "";
  const client = new NeynarAPIClient({ apiKey });

  try {
    // Perbaikan: Gunakan objek { fids: [...] } sesuai ekspektasi SDK terbaru
    const response = await client.fetchBulkUsers({ 
      fids: [parseInt(fid)] 
    });

    const user = response.users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Logika perhitungan skor (contoh sederhana berdasarkan followers)
    const score = (user.follower_count || 0) * 10;

    return NextResponse.json({ 
      score,
      user: {
        username: user.username,
        pfp: user.pfp_url
      }
    });
  } catch (error) {
    console.error("Neynar Score Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch score" },
      { status: 500 }
    );
  }
}
