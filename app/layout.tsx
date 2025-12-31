import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                const errorMessage = event.reason?.message || event.reason?.toString() || '';
                if (errorMessage.includes('CSP') || errorMessage.includes('privy')) {
                  event.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}

          {/* --- ONCHAT WIDGET START --- */}
          <div id="onchat-custom-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000 }}>
            {/* Window Chat */}
            <div id="chat-window" style={{ display: 'none', width: '350px', height: '500px', maxHeight: '70vh', background: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden', marginBottom: '15px', border: '1px solid #e0e0e0' }}>
              <div id="onchat-widget"></div>
            </div>

            {/* Floating Button Biru Remindersbase */}
            <button 
              id="onchat-trigger"
              style={{ float: 'right', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#3b82f6', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg id="chat-icon-svg" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span id="close-icon-text" style={{ display: 'none', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>×</span>
            </button>
          </div>

          <Script 
            src="https://onchat.sebayaki.com/widget.js"
            strategy="afterInteractive"
            onLoad={() => {
              // Inisialisasi widget
              // @ts-ignore
              if (typeof OnChat !== 'undefined') {
                // @ts-ignore
                OnChat.mount('#onchat-widget', {
                  channel: 'reminders',
                  theme: 'base-blue',
                  hideMobileTabs: true,
                  hideBrand: true
                });
              }

              // Event listener untuk tombol buka/tutup
              const btn = document.getElementById('onchat-trigger');
              const win = document.getElementById('chat-window');
              const icon = document.getElementById('chat-icon-svg');
              const closeTxt = document.getElementById('close-icon-text');

              btn?.addEventListener('click', () => {
                if (win && win.style.display === 'none') {
                  win.style.display = 'block';
                  if (icon) icon.style.display = 'none';
                  if (closeTxt) closeTxt.style.display = 'block';
                } else if (win) {
                  win.style.display = 'none';
                  if (icon) icon.style.display = 'block';
                  if (closeTxt) closeTxt.style.display = 'none';
                }
              });
            }}
          />
          {/* --- ONCHAT WIDGET END --- */}
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
