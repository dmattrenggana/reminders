import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "white",
            marginBottom: 16,
            textShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          Base Reminders
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 32,
            maxWidth: 700,
          }}
        >
          Never Miss What Matters - Commitment-based reminders with token stakes
        </div>
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 24px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 40, color: "white" }}>⏰</div>
            <div style={{ fontSize: 18, color: "white", marginTop: 8 }}>Set Reminders</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 24px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 40, color: "white" }}>🪙</div>
            <div style={{ fontSize: 18, color: "white", marginTop: 8 }}>Stake Tokens</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 24px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 40, color: "white" }}>✅</div>
            <div style={{ fontSize: 18, color: "white", marginTop: 8 }}>Stay Accountable</div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 800,
    },
  )
}
