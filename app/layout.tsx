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
                // Suppress harmless postMessage errors from Farcaster wallet connector
                // These errors occur when connector tries to communicate with wallet iframe
                // Error is harmless and doesn't affect functionality
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
                
                if (typeof window !== 'undefined' && ('Farcaster' in window || window.Farcaster)) {
                  try {
                    // Try to get SDK from window if already available
                    const sdk = window.Farcaster?.sdk || window.__farcasterSDK;
                    if (sdk && sdk.actions && sdk.actions.ready) {
                      console.log('[Layout Script] ⚡⚡⚡ CRITICAL: Calling sdk.actions.ready() IMMEDIATELY from layout...');
                      // Call ready() immediately without await
                      sdk.actions.ready({}).then(() => {
                        console.log('[Layout Script] ✅✅✅ ready() called successfully from layout');
                        window.__farcasterReady = true;
                      }).catch((error) => {
                        console.error('[Layout Script] ❌ ready() call failed:', error);
                        window.__farcasterReady = true; // Mark as ready anyway
                      });
                      window.__farcasterReady = true; // Set immediately
                    } else {
                      // SDK not available yet, will be called from FarcasterProvider
                      console.log('[Layout Script] SDK not available yet, will call from FarcasterProvider');
                    }
                  } catch (error) {
                    console.error('[Layout Script] Error calling ready():', error);
                    window.__farcasterReady = true; // Mark as ready anyway
                  }
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
