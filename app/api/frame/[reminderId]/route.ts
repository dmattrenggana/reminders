import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  const { reminderId } = await params;

  return NextResponse.json({
    message: `Frame for reminder ${reminderId}`,
    id: reminderId,
  });
}
