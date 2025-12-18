import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  // Menggunakan konfigurasi objek untuk Neynar SDK terbaru
  const apiKey = process.env.NEYNAR_API_KEY || "";
  const client = new NeynarAPIClient({ apiKey });

  try {
    // Perbaikan: Bungkus fid ke dalam objek sesuai ekspektasi SDK
    const response = await client.fetchBulkUsers({ 
      fids: [parseInt(fid)] 
    });

    if (!response.users || response.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: response.users[0] });
  } catch (error) {
    console.error("Neynar Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
