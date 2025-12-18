import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = "https://remindersbase.vercel.app";

export const metadata: Metadata = {
  title: "Base Reminders",
  description: "Never miss what matters on Farcaster",
  openGraph: {
    title: "Base Reminders",
    description: "Never miss what matters on Farcaster",
    url: appUrl,
    siteName: "Base Reminders",
    images: [`${appUrl}/og-image.png`],
    type: "website",
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/og-image.png`,
      button: {
        title: "Launch Reminders",
        action: {
          type: "launch_frame",
          name: "Base Reminders",
          url: appUrl,
          splashImageUrl: `${appUrl}/splash.png`,
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* SEMUA provider (Wagmi, Auth, Farcaster) ada di dalam komponen ini */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
