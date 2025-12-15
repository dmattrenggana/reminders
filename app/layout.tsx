import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"

// Miniapp embed object for Farcaster sharing
const miniappEmbed = {
  version: "1",
  imageUrl: `${appUrl}/api/og-image`,
  button: {
    title: "Open Base Reminders",
    action: {
      type: "launch_frame",
      url: appUrl,
      name: "Base Reminders",
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#667eea",
    },
  },
}

// Backward compatible frame embed
const frameEmbed = {
  version: "1",
  imageUrl: `${appUrl}/og-image.png`,
  button: {
    title: "Open Base Reminders",
    action: {
      type: "launch_frame",
      url: appUrl,
      name: "Base Reminders",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#4A90E2",
    },
  },
}

export const metadata: Metadata = {
  title: "Base Reminders - Never Miss What Matters",
  description: "Commitment-based reminders with token stakes on Farcaster. Lock tokens to stay accountable.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  openGraph: {
    title: "Base Reminders - Never Miss What Matters",
    description: "Commitment-based reminders with token stakes on Farcaster. Lock tokens to stay accountable.",
    url: appUrl,
    siteName: "Base Reminders",
    images: [
      {
        url: `${appUrl}/og-image.png`,
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
    images: [`${appUrl}/og-image.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniappEmbed),
    "fc:frame": JSON.stringify(frameEmbed),
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#667eea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = function(...args) {
                  if (args[0]?.includes?.('Analytics SDK') || args[0]?.context === 'AnalyticsSDKApiError') {
                    return;
                  }
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased ${_geist.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
