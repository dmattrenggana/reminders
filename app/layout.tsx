import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

// URL aplikasi Anda
const appUrl = "https://remindersbase.vercel.app";

export const metadata: Metadata = {
  title: "Reminders",
  description: "Never Miss What Matters",
  other: {
    // Verifikasi Base App
    "base:app_id": "69459f9dd77c069a945be194",
    
    // Metadata Farcaster Frame
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/logo.jpg`,
      button: {
        title: "Launch Reminders",
        action: {
          type: "launch_frame",
          name: "Reminders",
          url: `${appUrl}/`,
          splashImageUrl: `${appUrl}/logo.jpg`,
          splashBackgroundColor: "#4f46e5",
        },
      },
      // Menambahkan noindex: false sesuai standar terbaru agar searchable
      noindex: false,
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
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="frame-ancestors 'self' https://*.warpcast.com https://*.farcaster.xyz https://farcaster.xyz; connect-src 'self' https://*.warpcast.com https://*.farcaster.xyz https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com https://wrpcd.net https://*.wrpcd.net https://privy.farcaster.xyz https://privy.warpcast.com https://auth.privy.io https://*.rpc.privy.systems https://mainnet.base.org https://base.llamarpc.com https://base-rpc.publicnode.com https://explorer-api.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org wss://*.walletconnect.com https://cloudflareinsights.com;"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
