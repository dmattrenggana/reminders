import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // Impor pembungkus utama

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Base Reminders",
  description: "Farcaster Frame for Reminders",
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Providers di sini sudah mencakup Farcaster, Wagmi, dan QueryClient */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
