import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Base Reminders"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function Image({ params }: { params: { reminderId: string } }) {
  const reminderId = params.reminderId

  // Fetch reminder details
  let reminderData = null
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"
    const response = await fetch(`${baseUrl}/api/reminders/public`)
    const data = await response.json()
    reminderData = data.reminders?.find((r: any) => r.id.toString() === reminderId)
  } catch (error) {
    console.error("Error fetching reminder:", error)
  }

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#1a1a1a",
            marginBottom: "24px",
          }}
        >
          {reminderData?.description || "Base Reminders"}
        </h1>
        <p
          style={{
            fontSize: "32px",
            color: "#666",
            marginBottom: "16px",
          }}
        >
          By: {reminderData?.farcasterUsername || "User"}
        </p>
        <div
          style={{
            display: "flex",
            gap: "32px",
            fontSize: "28px",
            color: "#888",
          }}
        >
          <span>💰 {reminderData?.rewardPoolAmount || 0} COMMIT</span>
          <span>👥 {reminderData?.totalReminders || 0} helped</span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
