import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const appUrl = "https://remindersbase.vercel.app";

export const metadata: Metadata = {
  title: "Base Reminders",
  description: "Farcaster Frame v2",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/og-image.png`,
      button: {
        title: "Launch App",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
