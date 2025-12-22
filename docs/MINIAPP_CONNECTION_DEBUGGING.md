# 🔍 Miniapp Connection Debugging Guide

## 🎯 **Tujuan: Menemukan Masalah Koneksi Miniapp**

Guide ini membantu Anda menemukan masalah mengapa wallet tidak bisa connect di Farcaster miniapp.

---

## 📋 **Checklist Debugging**

### **1. Environment Detection** ✅

**Cek di Console:**
\`\`\`javascript
// Paste di console browser/miniapp
console.log('Farcaster in window:', 'Farcaster' in window);
console.log('window.Farcaster:', window.Farcaster);
console.log('User Agent:', navigator.userAgent);
\`\`\`

**Expected Output (di Miniapp):**
\`\`\`
Farcaster in window: true
window.Farcaster: [object Object]
User Agent: ... (Warpcast/Farcaster client)
\`\`\`

**Jika `false`:**
- ❌ App tidak terdeteksi sebagai miniapp
- ✅ Solusi: Pastikan app dibuka di Warpcast/Farcaster client, bukan browser

---

### **2. SDK Initialization** ✅

**Cek Console Log:**
\`\`\`
[Farcaster] Running in miniapp mode - initializing SDK...
[Farcaster] SDK imported successfully
[Farcaster] ⚡ CRITICAL: Calling sdk.actions.ready() IMMEDIATELY...
[Farcaster] ✅✅✅ ready() called successfully - splash screen should dismiss NOW
\`\`\`

**Jika tidak muncul:**
- ❌ SDK tidak ter-load
- ✅ Solusi: Cek error di console, pastikan `@farcaster/miniapp-sdk` terinstall

---

### **3. Connector Detection** ✅

**Cek Console Log:**
\`\`\`
[Wagmi Config] ✅ Farcaster miniapp connector initialized
[Wagmi Config] Connectors configured: [...]
[Auto-Connect] 📋 Available connectors: [...]
[Auto-Connect] ✅✅✅ Found Farcaster connector: { id: "...", name: "...", type: "..." }
\`\`\`

**Jika connector tidak ditemukan:**
- ❌ Connector tidak ter-initialize
- ✅ Solusi: Cek error di `[Wagmi Config]`, pastikan `@farcaster/miniapp-wagmi-connector` terinstall

---

### **4. Auto-Connect Process** ✅

**Cek Console Log:**
\`\`\`
[Auto-Connect] Starting auto-connect process...
[Auto-Connect] 🔍 Detected Farcaster Miniapp, attempting auto-connect...
[Auto-Connect] 🚀 Attempting to connect with connector: ...
[Auto-Connect] ✅ Connect call executed successfully
\`\`\`

**Jika gagal:**
- ❌ Error akan muncul di console
- ✅ Solusi: Lihat error message dan stack trace

---

### **5. Manual Connect** ✅

**Jika auto-connect gagal, coba manual:**

1. Klik "Connect Wallet" button
2. Cek console log:
   \`\`\`
   [ConnectWallet] Available connectors: [...]
   [ConnectWallet] ✅ Found Farcaster connector: {...}
   \`\`\`

**Jika connector tidak ditemukan:**
- ❌ Connector tidak tersedia
- ✅ Solusi: Cek apakah connector ter-initialize di `app/providers.tsx`

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Farcaster connector not found"**

**Symptoms:**
\`\`\`
[Auto-Connect] ❌❌❌ Farcaster connector NOT FOUND!
[Auto-Connect] Available connectors: [{ id: "injected", name: "..." }]
\`\`\`

**Possible Causes:**
1. Connector tidak ter-initialize
2. Connector ID berbeda dari yang diharapkan
3. Connector tidak tersedia di miniapp environment

**Solutions:**
1. Cek `app/providers.tsx` - pastikan `farcasterMiniApp()` dipanggil
2. Cek console untuk error saat connector initialization
3. Cek connector ID di console - mungkin berbeda dari yang diharapkan

---

### **Issue 2: "SDK import error"**

**Symptoms:**
\`\`\`
[Farcaster] SDK import error: ...
\`\`\`

**Possible Causes:**
1. `@farcaster/miniapp-sdk` tidak terinstall
2. Node.js version tidak sesuai
3. Build error

**Solutions:**
1. Run `npm install` untuk install dependencies
2. Pastikan Node.js >= 22.11.0
3. Cek build logs untuk error

---

### **Issue 3: "Environment not detected as miniapp"**

**Symptoms:**
\`\`\`
[Farcaster] Running in web browser mode
\`\`\`

**Possible Causes:**
1. App dibuka di browser, bukan Warpcast
2. `window.Farcaster` tidak tersedia
3. Environment detection logic salah

**Solutions:**
1. Pastikan app dibuka di Warpcast mobile/desktop
2. Cek `'Farcaster' in window` di console
3. Pastikan app di-deploy ke HTTPS (required untuk miniapp)

---

### **Issue 4: "ready() called but splash screen still stuck"**

**Symptoms:**
\`\`\`
[Farcaster] ✅✅✅ ready() called successfully
// But splash screen still visible
\`\`\`

**Possible Causes:**
1. `ready()` dipanggil terlalu cepat
2. Error di `ready()` call yang di-swallow
3. Farcaster client issue

**Solutions:**
1. Cek apakah ada error setelah `ready()` call
2. Cek network tab untuk failed requests
3. Coba refresh miniapp

---

### **Issue 5: "Connection fails silently"**

**Symptoms:**
\`\`\`
[Auto-Connect] ✅ Connect call executed
// But wallet not connected
\`\`\`

**Possible Causes:**
1. User rejected connection
2. Connector error yang tidak di-log
3. Wagmi connection state tidak update

**Solutions:**
1. Cek Wagmi connection state: `useAccount().isConnected`
2. Cek error di console setelah connect call
3. Coba manual connect via button

---

## 🔧 **Debugging Steps**

### **Step 1: Check Environment**

\`\`\`javascript
// Paste di console
console.log({
  hasFarcaster: 'Farcaster' in window,
  windowFarcaster: window.Farcaster,
  userAgent: navigator.userAgent,
  location: window.location.href
});
\`\`\`

### **Step 2: Check SDK**

\`\`\`javascript
// Paste di console
console.log({
  sdkAvailable: typeof window !== 'undefined' && window.__farcasterSDK,
  readyCalled: window.__farcasterReady
});
\`\`\`

### **Step 3: Check Connectors**

\`\`\`javascript
// Paste di console (di React DevTools atau via window)
// Connectors akan ter-log otomatis di console
\`\`\`

### **Step 4: Check Connection State**

\`\`\`javascript
// Di React DevTools, cek:
// - useAccount().isConnected
// - useAccount().address
// - useConnect().connectors
\`\`\`

---

## 📝 **Logging yang Harus Muncul**

### **Success Flow:**

\`\`\`
[Farcaster] Environment detection: { isInMiniApp: true, ... }
[Farcaster] Running in miniapp mode - initializing SDK...
[Farcaster] SDK imported successfully
[Farcaster] ⚡ CRITICAL: Calling sdk.actions.ready() IMMEDIATELY...
[Farcaster] ✅✅✅ ready() called successfully - splash screen should dismiss NOW
[Wagmi Config] ✅ Farcaster miniapp connector initialized
[Wagmi Config] Connectors configured: [...]
[Auto-Connect] Starting auto-connect process...
[Auto-Connect] 🔍 Detected Farcaster Miniapp, attempting auto-connect...
[Auto-Connect] 📋 Available connectors: [...]
[Auto-Connect] ✅✅✅ Found Farcaster connector: {...}
[Auto-Connect] 🚀 Attempting to connect with connector: ...
[Auto-Connect] ✅ Connect call executed successfully
\`\`\`

---

## 🎯 **Next Steps**

1. **Deploy ke production** (HTTPS required untuk miniapp)
2. **Test di Warpcast** (mobile atau desktop)
3. **Cek console logs** untuk melihat di mana proses terhenti
4. **Share console logs** jika masih ada masalah

---

## 📚 **Referensi**

- [Farcaster Miniapp Docs](https://miniapps.farcaster.xyz/docs/getting-started)
- [Wagmi Connectors](https://wagmi.sh/core/connectors)
- [Console Errors Explanation](./CONSOLE_ERRORS_EXPLANATION.md)
