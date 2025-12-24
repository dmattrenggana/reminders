import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Suppress unhandled promise rejection errors from Neynar SDK */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress unhandled promise rejection errors from Neynar SDK
              window.addEventListener('unhandledrejection', function(event) {
                // Check if error is from Neynar SDK or Farcaster components
                const errorMessage = event.reason?.message || event.reason?.toString() || '';
                const errorStack = event.reason?.stack || '';
                
                // Suppress known harmless errors from Neynar SDK
                if (
                  errorMessage.includes('UnfocusedCast') ||
                  errorStack.includes('UnfocusedCast') ||
                  errorMessage.includes('@neynar') ||
                  errorStack.includes('@neynar') ||
                  errorStack.includes('neynar')
                ) {
                  console.debug('[Suppressed] Neynar SDK unhandled promise rejection:', errorMessage);
                  event.preventDefault(); // Prevent error from being logged
                  return false;
                }
              });
              
              // Also suppress console errors for the same patterns
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const errorStr = args.join(' ');
                if (
                  errorStr.includes('UnfocusedCast') ||
                  errorStr.includes('Uncaught (in promise)') ||
                  (errorStr.includes('Event') && errorStr.includes('UnfocusedCast'))
                ) {
                  console.debug('[Suppressed] Neynar SDK console error:', errorStr);
                  return;
                }
                originalConsoleError.apply(console, args);
              };
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
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
    generator: 'v0.app'
};
