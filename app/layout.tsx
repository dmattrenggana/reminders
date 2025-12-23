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
                // Suppress harmless errors from Farcaster wallet connector and image loading
                const originalError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  // Suppress postMessage origin mismatch errors from Farcaster connector
                  if (typeof message === 'string' && 
                      message.includes('postMessage') && 
                      (message.includes('farcaster.xyz') || message.includes('wallet.farcaster.xyz'))) {
                    // Error is harmless - Farcaster connector handles this internally
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
                
                // Poll for SDK availability with timeout
                // Per Farcaster docs: Call ready() after SDK is available and interface is ready
                if (typeof window !== 'undefined') {
                  let attempts = 0;
                  const maxAttempts = 30; // 3 seconds max (30 * 100ms)
                  
                  const tryReady = setInterval(function() {
                    attempts++;
                    
                    // Check if Farcaster environment
                    const isFarcasterEnv = 'Farcaster' in window || window.Farcaster;
                    if (!isFarcasterEnv) {
                      if (attempts >= maxAttempts) {
                        clearInterval(tryReady);
                        console.log('[Layout Script] Not in Farcaster miniapp environment');
                      }
                      return;
                    }
                    
                    // Try to get SDK
                    const sdk = window.Farcaster?.sdk || window.__farcasterSDK;
                    if (sdk && sdk.actions && sdk.actions.ready) {
                      clearInterval(tryReady);
                      console.log('[Layout Script] ✅ SDK found, calling ready()...');
                      
                      try {
                        // Call ready() immediately - per Farcaster docs: call as soon as possible
                        sdk.actions.ready({}).then(function() {
                          console.log('[Layout Script] ✅✅✅ ready() called successfully from layout');
                          window.__farcasterReady = true;
                        }).catch(function(error) {
                          console.error('[Layout Script] ❌ ready() call failed:', error);
                          window.__farcasterReady = true; // Mark as ready anyway
                        });
                        window.__farcasterReady = true; // Set immediately
                      } catch (error) {
                        console.error('[Layout Script] Error calling ready():', error);
                        window.__farcasterReady = true; // Mark as ready anyway
                      }
                      return;
                    }
                    
                    // Timeout after max attempts
                    if (attempts >= maxAttempts) {
                      clearInterval(tryReady);
                      console.log('[Layout Script] ⏱️ Timeout waiting for SDK, will call from FarcasterProvider');
                      // Don't set __farcasterReady here - let FarcasterProvider handle it
                    }
                  }, 100); // Check every 100ms
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
