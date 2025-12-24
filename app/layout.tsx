import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js" 
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

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

};


