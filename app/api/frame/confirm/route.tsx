import type { NextRequest } from "next/server"
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const reminderId = url.searchParams.get("id")

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
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
            fontSize: 96,
            marginBottom: "24px",
          }}
        >
          ✅
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            marginBottom: "16px",
            color: "#38a169",
          }}
        >
          Confirmed!
        </div>
        <div
          style={{
            fontSize: 24,
            textAlign: "center",
            color: "#666",
          }}
        >
          Open the app to complete the on-chain confirmation and reclaim your tokens
        </div>
        {reminderId && (
          <div
            style={{
              fontSize: 20,
              color: "#999",
              marginTop: "24px",
            }}
          >
            Reminder #{reminderId}
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
