import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcasterFid, reminderData } = body;

    if (!farcasterFid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const apiKey = process.env.NEYNAR_API_KEY || "";
    const neynarClient = new NeynarAPIClient({ apiKey });

    // Perbaikan: Bungkus farcasterFid ke dalam objek fids
    const userdata = await neynarClient.fetchBulkUsers({ 
      fids: [Number(farcasterFid)] 
    });
    
    const user = userdata.users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Di sini Anda bisa menambahkan logika penyimpanan database (misal: Supabase/Prisma)
    // Untuk sekarang, kita kembalikan respon sukses
    return NextResponse.json({ 
      success: true, 
      message: "Reminder recorded",
      user: user.username 
    });

  } catch (error) {
    console.error("Record Reminder Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
