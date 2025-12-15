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
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "white",
            marginBottom: 20,
            textShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          Base Reminders
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 40,
            maxWidth: 800,
          }}
        >
          Never Miss What Matters
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 30px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 48, color: "white" }}>⏰</div>
            <div style={{ fontSize: 20, color: "white", marginTop: 10 }}>Set Reminders</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 30px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 48, color: "white" }}>🪙</div>
            <div style={{ fontSize: 20, color: "white", marginTop: 10 }}>Stake Tokens</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 30px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 48, color: "white" }}>✅</div>
            <div style={{ fontSize: 20, color: "white", marginTop: 10 }}>Stay Accountable</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
            marginTop: 60,
          }}
        >
          Commitment-based reminders on Base Mainnet
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
