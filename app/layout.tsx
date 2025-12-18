import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Base Reminders",
  description: "Farcaster Frame v2 App",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://remindersbase.vercel.app/logo.jpg",
      button: {
        title: "Remind Me!",
        action: {
          type: "launch_frame",
          name: "Base Reminders",
          url: "https://remindersbase.vercel.app",
          splashImageUrl: "https://remindersbase.vercel.app/logo.jpg",
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
