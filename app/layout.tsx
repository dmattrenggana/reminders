import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FarcasterProvider } from "@/components/providers/farcaster-provider";

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
        {/* Provider ini yang mengelola login otomatis */}
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </body>
    </html>
  );
}
