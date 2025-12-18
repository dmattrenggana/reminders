import type { NextRequest } from "next/server"
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const reminderId = url.searchParams.get("id")
  const description = url.searchParams.get("desc") || "Reminder notification"

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "white",
          borderRadius: "24px",
          padding: "48px",
          maxWidth: "800px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            marginBottom: "24px",
            color: "#667eea",
          }}
        >
          ⏰ Reminder Alert
        </div>
        <div
          style={{
            fontSize: 32,
            textAlign: "center",
            color: "#333",
            marginBottom: "32px",
            maxWidth: "600px",
          }}
        >
          {description}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#666",
            marginTop: "16px",
          }}
        >
          {reminderId ? `Reminder #${reminderId}` : "CommitRemind"}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { buttonIndex, untrustedData } = body

  const reminderId = untrustedData?.state?.reminderId
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"

  // Button 1: Confirm reminder
  if (buttonIndex === 1) {
    return new Response(
      JSON.stringify({
        type: "frame",
        frameUrl: `${baseUrl}/api/frame/confirm?id=${reminderId}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Button 2: View details
  if (buttonIndex === 2) {
    return new Response(
      JSON.stringify({
        type: "frame",
        frameUrl: `${baseUrl}/?reminder=${reminderId}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  return new Response("Invalid button", { status: 400 })
}
