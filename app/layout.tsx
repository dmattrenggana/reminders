import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from 'next/script';

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
                // Check if error is from Neynar SDK, Farcaster components, or CSP
                const errorMessage = event.reason?.message || event.reason?.toString() || '';
                const errorStack = event.reason?.stack || '';
                const eventType = event.reason?.type || '';
                const eventTarget = event.reason?.target?.tagName || '';
                
                // Suppress CSP errors (harmless - from optional features like Privy/WalletConnect)
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
                  console.debug('[Suppressed] CSP unhandled promise rejection (harmless - from Privy/WalletConnect optional features)');
                  event.preventDefault(); // Prevent error from being logged
                  return false;
                }
                
                // Suppress 429 rate limit errors (handled by RPC provider with retry and exponential backoff)
                if (
                  errorMessage.includes('429') ||
                  errorMessage.includes('Too Many Requests') ||
                  errorMessage.includes('rate limit') ||
                  errorStack.includes('429') ||
                  errorStack.includes('quiknode') ||
                  errorStack.includes('Too Many Requests')
                ) {
                  console.debug('[Suppressed] 429 rate limit error (handled by RPC provider with retry and backoff)');
                  event.preventDefault();
                  return false;
                }
                
                // Suppress known harmless errors from Neynar SDK
                if (
                  errorMessage.includes('UnfocusedCast') ||
                  errorStack.includes('UnfocusedCast') ||
                  errorMessage.includes('@neynar') ||
                  errorStack.includes('@neynar') ||
                  errorStack.includes('neynar') ||
                  eventType === 'error' && eventTarget === 'IMG' ||
                  event.reason instanceof Event && event.reason.type === 'error'
                ) {
                  console.debug('[Suppressed] Neynar SDK unhandled promise rejection');
                  event.preventDefault(); // Prevent error from being logged
                  return false;
                }
              });
              
              // 2. Suppress console errors for the same patterns
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const errorStr = args.join(' ');
                const firstArg = args[0];
                
                // Suppress 429 rate limit errors in console.error
                if (
                  errorStr.includes('429') ||
                  errorStr.includes('Too Many Requests') ||
                  errorStr.includes('rate limit') ||
                  (errorStr.includes('quiknode.pro') && (errorStr.includes('429') || errorStr.includes('Too Many Requests')))
                ) {
                  console.debug('[Suppressed] 429 rate limit error in console.error (handled by RPC provider)');
                  return;
                }
                
                // Check if this is an Event object (image loading error)
                if (firstArg && typeof firstArg === 'object' && firstArg.type === 'error' && firstArg.target && firstArg.target.tagName === 'IMG') {
                  console.debug('[Suppressed] Neynar SDK image loading error');
                  return;
                }
                
                if (
                  errorStr.includes('UnfocusedCast') ||
                  errorStr.includes('Uncaught (in promise)') ||
                  (errorStr.includes('Event') && errorStr.includes('UnfocusedCast'))
                ) {
                  console.debug('[Suppressed] Neynar SDK console error');
                  return;
                }
                originalConsoleError.apply(console, args);
              };
              
              // 3. Global error handler for image loading errors (last resort)
              window.addEventListener('error', function(event) {
                // Check if this is an image loading error from Neynar components
                if (event.target && event.target.tagName === 'IMG') {
                  const imgSrc = event.target.src || '';
                  // Suppress Neynar-related image errors
                  if (
                    imgSrc.includes('neynar') ||
                    imgSrc.includes('warpcast') ||
                    imgSrc.includes('farcaster')
                  ) {
                    console.debug('[Suppressed] Image loading error from Neynar/Farcaster:', imgSrc.substring(0, 100));
                    event.preventDefault();
                    return false;
                  }
                }
                
                // Suppress CSP errors that are handled gracefully
                const errorMessage = event.message || '';
                const errorTarget = event.target as any;
                const errorSrc = errorTarget?.src || errorTarget?.href || '';
                
                // Suppress 429 rate limit errors (handled by RPC provider with retry)
                if (
                  errorMessage.includes('429') ||
                  errorMessage.includes('Too Many Requests') ||
                  errorMessage.includes('rate limit') ||
                  (errorSrc.includes('quiknode.pro') && (errorMessage.includes('429') || errorMessage.includes('Too Many Requests'))) ||
                  errorTarget?.href?.includes('quiknode.pro') ||
                  errorTarget?.src?.includes('quiknode.pro')
                ) {
                  console.debug('[Suppressed] 429 rate limit error (handled by RPC provider with retry and backoff)');
                  event.preventDefault();
                  return false;
                }
                
                if (
                  errorMessage.includes('Content Security Policy') ||
                  errorMessage.includes('CSP') ||
                  errorMessage.includes('violates') ||
                  (errorMessage.includes('Failed to fetch') && errorMessage.includes('violates')) ||
                  errorSrc.includes('privy') ||
                  errorSrc.includes('walletconnect')
                ) {
                  // Only suppress if it's a known harmless CSP error
                  // (e.g., from Privy/WalletConnect optional features)
                  console.debug('[Suppressed] CSP error (handled gracefully):', errorMessage.substring(0, 100));
                  event.preventDefault();
                  return false;
                }
              }, true); // Use capture phase to catch errors early
              
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
