# CSP WalletConnect Error - Explanation

## ⚠️ **Error yang Terlihat**

\`\`\`
Connecting to 'https://explorer-api.walletconnect.com/v3/wallets?projectId=...' 
violates the following Content Security Policy directive: "connect-src 'self' ..."
\`\`\`

## 🔍 **Root Cause**

1. **CSP dari Farcaster Environment**: Farcaster miniapp environment (Warpcast/Farcaster client) meng-inject CSP mereka sendiri yang lebih ketat
2. **CSP Override**: CSP dari Farcaster environment meng-override CSP kita (dari `vercel.json`)
3. **Privy Dependency**: Privy (dependency transitif dari Farcaster connector) mencoba fetch wallet list dari WalletConnect Explorer API
4. **WalletConnect Tidak Diizinkan**: CSP dari Farcaster tidak mengizinkan `explorer-api.walletconnect.com`

## ✅ **Apakah Error Ini Mempengaruhi Fungsionalitas?**

**TIDAK!** Error ini **tidak mempengaruhi** fungsionalitas aplikasi karena:

1. ✅ Kita **tidak menggunakan WalletConnect** secara langsung
2. ✅ Kita menggunakan **Farcaster Miniapp connector** untuk wallet connection
3. ✅ Privy hanya mencoba fetch wallet list untuk discovery (optional feature)
4. ✅ Semua fitur aplikasi tetap berfungsi normal:
   - ✅ Wallet connection (via Farcaster connector)
   - ✅ Contract interactions
   - ✅ Token balance display
   - ✅ Reminder creation/management

## 🛠️ **Solusi yang Sudah Diterapkan**

### 1. CSP Configuration di `vercel.json`

CSP sudah dikonfigurasi dengan benar di `vercel.json` untuk allow WalletConnect domains:

\`\`\`json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "connect-src ... https://explorer-api.walletconnect.com https://*.walletconnect.com ..."
        }
      ]
    }
  ]
}
\`\`\`

### 2. Removed Meta Tag CSP

Meta tag CSP di `app/layout.tsx` sudah dihapus karena:
- ❌ Tidak efektif untuk `frame-ancestors` (browser mengabaikan)
- ❌ Menyebabkan warning di console
- ✅ CSP sudah dikonfigurasi di `vercel.json`

### 3. Disabled Wallet Discovery

Di `app/providers.tsx`, wallet discovery sudah di-disable:

\`\`\`typescript
export const config = createConfig({
  chains: [base],
  multiInjectedProviderDiscovery: false, // ✅ Disabled
  connectors: [
    farcasterMiniApp(), // ✅ Farcaster connector
    injected(),         // ✅ Injected connector
  ],
});
\`\`\`

## 📝 **Kesimpulan**

1. **Error ini adalah warning saja** - tidak mempengaruhi fungsionalitas
2. **CSP dari Farcaster environment** meng-override CSP kita (tidak bisa kita kontrol)
3. **Privy mencoba fetch wallet list** yang tidak diperlukan untuk Farcaster miniapp
4. **Semua fitur tetap berfungsi** - error hanya di console

## 🎯 **Rekomendasi**

### Option 1: Ignore Error (Recommended)

Error ini bisa diabaikan karena:
- ✅ Tidak mempengaruhi fungsionalitas
- ✅ Hanya warning di console
- ✅ User tidak melihat error ini

### Option 2: Suppress Error (Jika Mengganggu)

Jika ingin suppress error di console, bisa tambahkan error handler:

\`\`\`typescript
// Di app/providers.tsx atau _app.tsx
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('WalletConnect') || 
        event.message?.includes('CSP')) {
      event.preventDefault(); // Suppress error
      return false;
    }
  });
}
\`\`\`

**Note**: Suppressing error tidak direkomendasikan karena bisa menyembunyikan error penting lainnya.

## 📚 **Referensi**

- [Farcaster Miniapp Docs](https://miniapps.farcaster.xyz/docs/getting-started)
- [Content Security Policy MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vercel Headers Configuration](https://vercel.com/docs/concepts/projects/project-configuration#headers)
