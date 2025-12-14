import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Base Reminders - Never Miss What Matters",
  description: "Commitment-based reminders with token stakes on Farcaster. Lock tokens to stay accountable.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Base Reminders - Never Miss What Matters",
    description: "Commitment-based reminders with token stakes on Farcaster. Lock tokens to stay accountable.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app",
    siteName: "Base Reminders",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Base Reminders",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Reminders - Never Miss What Matters",
    description: "Commitment-based reminders with token stakes on Farcaster. Lock tokens to stay accountable.",
    images: ["/logo.jpg"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"}/logo.jpg`,
    "fc:frame:button:1": "Open App",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${_geist.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
