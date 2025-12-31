import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from 'next/script';
import OnChatWidget from "@/components/OnChatWidget";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Suppress errors from Neynar SDK (UnfocusedCast image loading, etc) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 1. Suppress unhandled promise rejection errors from Neynar SDK and CSP
              window.addEventListener('unhandledrejection', function(event) {
                const errorMessage = event.reason?.message || event.reason?.toString() || '';
                const errorStack = event.reason?.stack || '';
                const eventType = event.reason?.type || '';
                const eventTarget = event.reason?.target?.tagName || '';
                
                if (
                  errorMessage.includes('Content Security Policy') ||
                  errorMessage.includes('CSP') ||
                  errorMessage.includes('violates the document') ||
                  errorMessage.includes('violates') ||
                  (errorMessage.includes('Failed to fetch') && errorMessage.includes('violates')) ||
                  errorStack.includes('Content Security Policy') ||
                  errorStack.includes('CSP') ||
                  errorStack.includes('privy-provider') ||
                  errorStack.includes('privy')
                ) {
                  console.debug('[Suppressed] CSP unhandled promise rejection');
                  event.preventDefault();
                  return false;
                }
                
                if (
                  errorMessage.includes('429') ||
                  errorMessage.includes('Too Many Requests') ||
                  errorMessage.includes('rate limit') ||
                  errorStack.includes('429') ||
                  errorStack.includes('quiknode')
                ) {
                  console.debug('[Suppressed] 429 rate limit error');
                  event.preventDefault();
                  return false;
                }
                
                if (
                  errorMessage.includes('UnfocusedCast') ||
                  errorStack.includes('UnfocusedCast') ||
                  errorMessage.includes('@neynar') ||
                  eventType === 'error' && eventTarget === 'IMG' ||
                  event.reason instanceof Event && event.reason.type === 'error'
                ) {
                  console.debug('[Suppressed] Neynar SDK unhandled promise rejection');
                  event.preventDefault();
                  return false;
                }
              });
              
              // 2. Suppress console errors for the same patterns
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const errorStr = args.join(' ');
                const firstArg = args[0];
                
                if (
                  errorStr.includes('429') ||
                  errorStr.includes('Too Many Requests') ||
                  errorStr.includes('rate limit') ||
                  (errorStr.includes('quiknode.pro') && (errorStr.includes('429') || errorStr.includes('Too Many Requests')))
                ) {
                  console.debug('[Suppressed] 429 rate limit error');
                  return;
                }
                
                if (firstArg && typeof firstArg === 'object' && firstArg.type === 'error' && firstArg.target && firstArg.target.tagName === 'IMG') {
                  console.debug('[Suppressed] Neynar SDK image loading error');
                  return;
                }
                
                if (errorStr.includes('UnfocusedCast') || errorStr.includes('Uncaught (in promise)')) {
                  console.debug('[Suppressed] Neynar SDK console error');
                  return;
                }
                originalConsoleError.apply(console, args);
              };
              
              // 3. Global error handler for image loading errors
              window.addEventListener('error', function(event) {
                if (event.target && event.target.tagName === 'IMG') {
                  const imgSrc = event.target.src || '';
                  if (imgSrc.includes('neynar') || imgSrc.includes('warpcast') || imgSrc.includes('farcaster')) {
                    console.debug('[Suppressed] Image loading error:', imgSrc.substring(0, 100));
                    event.preventDefault();
                    return false;
                  }
                }
                
                const errorMessage = event.message || '';
                const errorTarget = event.target;
                const errorSrc = errorTarget?.src || errorTarget?.href || '';
                
                if (errorMessage.includes('429') || errorSrc.includes('quiknode.pro')) {
                  event.preventDefault();
                  return false;
                }
                
                if (errorMessage.includes('CSP') || errorSrc.includes('privy') || errorSrc.includes('walletconnect')) {
                  event.preventDefault();
                  return false;
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          {/* Widget Chat Melayang */}
          <OnChatWidget />
        </Providers>
        <Script 
          src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js" 
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

// URL aplikasi Anda
const appUrl = "https://remindersbase.vercel.app";

export const metadata: Metadata = {
  title: "Reminders",
  description: "Never Miss What Matters",
  other: {
    "base:app_id": "69459f9dd77c069a945be194",
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
      noindex: false,
    }),
  },
};
