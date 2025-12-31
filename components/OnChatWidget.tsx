"use client";

import Script from 'next/script';

export default function OnChatWidget() {
  const initChat = () => {
    // @ts-ignore
    if (typeof OnChat !== 'undefined') {
      // @ts-ignore
      OnChat.mount('#onchat-widget', {
        channel: 'reminders',
        theme: 'base-blue',
        hideMobileTabs: true,
        hideBrand: true,
        // Mencoba fetch data user secara otomatis dari context frame
        user: {
          autoConnect: true 
        }
      });
    }

    const btn = document.getElementById('onchat-trigger');
    const win = document.getElementById('chat-window');
    const icon = document.getElementById('chat-icon-svg');
    const closeTxt = document.getElementById('close-icon-text');

    btn?.addEventListener('click', () => {
      if (win && (win.style.display === 'none' || win.style.display === '')) {
        win.style.display = 'flex';
        if (icon) icon.style.display = 'none';
        if (closeTxt) closeTxt.style.display = 'block';
      } else if (win) {
        win.style.display = 'none';
        if (icon) icon.style.display = 'block';
        if (closeTxt) closeTxt.style.display = 'none';
      }
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-chat-bounce {
          animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        /* Memastikan konten di dalam widget bisa discroll dan tampil penuh */
        #onchat-widget iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 400px;
          border: none !important;
        }
      `}} />

      {/* Container utama: Dinaikkan ke bottom: 85px agar di atas tombol Create Reminder */}
      <div id="onchat-custom-container" style={{ 
        position: 'fixed', 
        bottom: '85px', // Di atas tombol Create Reminder
        right: '20px', 
        zIndex: 10000, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-end' 
      }}>
        
        {/* Window Chat - Ukuran disesuaikan agar proporsional */}
        <div id="chat-window" style={{ 
          display: 'none', 
          flexDirection: 'column',
          width: '300px', 
          height: '420px', 
          maxHeight: '60vh', 
          background: 'white', 
          borderRadius: '16px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
          overflow: 'hidden', 
          marginBottom: '12px', 
          border: '1px solid #efefef'
        }}>
          <div id="onchat-widget" style={{ width: '100%', height: '100%' }}></div>
        </div>

        {/* Floating Button - Ukuran lebih kecil (42px) agar terlihat profesional */}
        <button 
          id="onchat-trigger"
          className="animate-chat-bounce"
          style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            backgroundColor: '#4f46e5', // Indigo Match
            border: 'none', 
            cursor: 'pointer', 
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg id="chat-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span id="close-icon-text" style={{ display: 'none', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>×</span>
        </button>
      </div>

      <Script 
        src="https://onchat.sebayaki.com/widget.js"
        strategy="afterInteractive"
        onLoad={initChat}
      />
    </>
  );
}
