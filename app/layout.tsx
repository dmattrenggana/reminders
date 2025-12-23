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
        {/* CRITICAL: Call ready() immediately if in Farcaster miniapp */}
        {/* This must be called BEFORE React mounts to dismiss splash screen */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress harmless errors from Farcaster wallet connector, image loading, and Privy/WalletConnect
                const originalError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  // Suppress postMessage origin mismatch errors from Farcaster connector
                  if (typeof message === 'string' && 
                      message.includes('postMessage') && 
                      (message.includes('farcaster.xyz') || message.includes('wallet.farcaster.xyz'))) {
                    // Error is harmless - Farcaster connector handles this internally
                    return true; // Suppress error
                  }
                  // Suppress WalletConnect CSP errors from Privy (dependency transitif)
                  // Privy mencoba fetch wallet list dari WalletConnect Explorer API (optional feature)
                  if (typeof message === 'string' && 
                      (message.includes('WalletConnect') || 
                       message.includes('explorer-api.walletconnect.com') ||
                       message.includes('walletconnect.com') ||
                       message.includes('CSP') && message.includes('walletconnect'))) {
                    // Error is harmless - Privy wallet discovery is optional, not critical
                    // Don't log to reduce console noise
                    return true; // Suppress error
                  }
                  // Suppress Farcaster video stream errors (harmless)
                  if (typeof message === 'string' && 
                      (message.includes('stream.farcaster.xyz') ||
                       message.includes('Failed to load resource') && message.includes('stream'))) {
                    // Error is harmless - video streams may fail but don't affect functionality
                    return true; // Suppress error
                  }
                  // Suppress Farcaster API errors (harmless - internal API may be unavailable)
                  if (typeof message === 'string' && 
                      (message.includes('/~api/v2/unseen') ||
                       message.includes('UnhandledFetchError') ||
                       message.includes('Failed to fetch') && message.includes('farcaster.xyz'))) {
                    // Error is harmless - Farcaster internal API may be unavailable in miniapp
                    return true; // Suppress error
                  }
                  // Let other errors through
                  if (originalError) {
                    return originalError.call(this, message, source, lineno, colno, error);
                  }
                  return false;
                };
                
                // Suppress unhandled promise rejections from image loading errors
                const originalUnhandledRejection = window.onunhandledrejection;
                window.onunhandledrejection = function(event) {
                  // Suppress image loading errors (harmless - handled by onError handlers)
                  if (event.reason && typeof event.reason === 'object') {
                    const reason = event.reason;
                    // Check if it's an Event object from image error
                    if (reason.type === 'error' && reason.target && reason.target.tagName === 'IMG') {
                      event.preventDefault(); // Suppress error
                      return;
                    }
                  }
                  // Let other rejections through
                  if (originalUnhandledRejection) {
                    return originalUnhandledRejection.call(this, event);
                  }
                };
                
                // Early attempt to call ready() if SDK is already available
                // Simplified: Single check without polling
                // FarcasterProvider is the PRIMARY caller if this fails
                if (typeof window !== 'undefined') {
                  // Check once if SDK is immediately available (injected by Farcaster)
                  const checkSDK = function() {
                    const isFarcasterEnv = 'Farcaster' in window || window.Farcaster;
                    if (isFarcasterEnv) {
                      const sdk = window.Farcaster?.sdk || window.__farcasterSDK;
                      if (sdk && sdk.actions && sdk.actions.ready) {
                        console.log('[Layout Script] ✅ SDK available, calling ready()...');
                        try {
                          sdk.actions.ready({});
                          window.__farcasterReady = true;
                          console.log('[Layout Script] ✅ ready() called');
                        } catch (error) {
                          console.log('[Layout Script] ready() failed, FarcasterProvider will handle');
                        }
                      }
                    }
                  };
                  
                  // Try immediately
                  checkSDK();
                  
                  // Also try after a short delay (50ms) in case SDK loads very quickly
                  setTimeout(checkSDK, 50);
                }
              })();
            `,
          }}
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
