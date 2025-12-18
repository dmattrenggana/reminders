import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { reminderId: string } }) {
  const reminderId = params.reminderId
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"

  // Fetch reminder data
  let reminderData = null
  try {
    const response = await fetch(`${baseUrl}/api/reminders/public`)
    const data = await response.json()
    reminderData = data.reminders?.find((r: any) => r.id.toString() === reminderId)
  } catch (error) {
    console.error("Error fetching reminder:", error)
  }

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/feed/${reminderId}/opengraph-image" />
    <meta property="fc:frame:button:1" content="View & Help Remind" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}/feed?reminder=${reminderId}" />
    <meta property="og:image" content="${baseUrl}/feed/${reminderId}/opengraph-image" />
    <meta property="og:title" content="${reminderData?.description || "Base Reminders"}" />
    <meta property="og:description" content="Help ${reminderData?.farcasterUsername || "this user"} stay committed and earn rewards!" />
    <title>${reminderData?.description || "Base Reminders"}</title>
  </head>
  <body>
    <h1>${reminderData?.description || "Base Reminders"}</h1>
    <p>Redirecting to app...</p>
    <script>
      window.location.href = "${baseUrl}/feed?reminder=${reminderId}";
    </script>
  </body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}
