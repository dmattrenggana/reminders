import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Public Reminders Feed | Base Reminders",
  description: "Help others stay committed and earn rewards",
  openGraph: {
    title: "Public Reminders Feed",
    description: "Help others stay committed and earn rewards",
    images: ["/abstract-profile.png"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"}/abstract-profile.png`,
    "fc:frame:button:1": "View Reminders",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": `${process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"}/feed`,
  },
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
