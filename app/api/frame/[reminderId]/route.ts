import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params;

    // Logika dasar untuk Frame v2 Redirect/Response
    // Anda bisa menyesuaikan payload ini sesuai kebutuhan metadata Frame Anda
    return NextResponse.json({
      id: reminderId,
      message: "Frame metadata for reminder",
      // Tambahkan property lain yang dibutuhkan frame Anda di sini
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params;
    const body = await request.json();

    return NextResponse.json({
      message: `Action processed for reminder ${reminderId}`,
      received: body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process post request" },
      { status: 400 }
    );
  }
}
