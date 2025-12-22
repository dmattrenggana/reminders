# 🔗 Farcaster Wallet Integration Guide

## 📚 **Berdasarkan Dokumentasi Resmi**

Implementasi ini mengikuti [Farcaster Miniapp Wallet Guide](https://miniapps.farcaster.xyz/docs/guides/wallets).

---

## 🎯 **Key Points dari Dokumentasi**

### **1. Auto-Connect Behavior** ✅

**Per Farcaster Docs:**
> "If a user already has a connected wallet the connector will automatically connect to it (e.g. `isConnected` will be true)."

**Implementasi:**
\`\`\`typescript
// ✅ CORRECT: Check isConnected FIRST
if (isConnected) {
  console.log("Already connected (connector auto-connected)");
  return; // Don't manually connect
}

// Only manually connect if auto-connect didn't happen
if (!isConnected && connector.ready) {
  connect({ connector: fcConnector });
}
\`\`\`

**Alasan:**
- Connector **otomatis** connect jika user sudah punya wallet
- Tidak perlu manual `connect()` call jika sudah connected
- Manual connect hanya jika auto-connect tidak terjadi

---

### **2. No Wallet Selection Dialog** ✅

**Per Farcaster Docs:**
> "Your Mini App won't need to show a wallet selection dialog that is common in a web based dapp, the Farcaster client hosting your app will take care of getting the user connected to their preferred crypto wallet."

**Implementasi:**
\`\`\`typescript
// ✅ CORRECT: Just call connect() - Farcaster handles the rest
connect({ connector: fcConnector });
// No need to show wallet selection UI
\`\`\`

**Alasan:**
- Farcaster client handle wallet selection
- User tidak perlu pilih wallet manual
- UX lebih smooth

---

### **3. Always Check Connection** ✅

**Per Farcaster Docs:**
> "It's possible a user doesn't have a connected wallet so you should always check for a connection and prompt them to connect if they aren't already connected."

**Implementasi:**
\`\`\`typescript
// ✅ CORRECT: Always check connection state
const { isConnected, address } = useAccount();

if (isConnected) {
  return <div>Connected: {address}</div>;
}

return <button onClick={handleConnect}>Connect</button>;
\`\`\`

**Alasan:**
- User mungkin belum punya wallet connected
- Selalu check `isConnected` sebelum assume connected
- Prompt user untuk connect jika belum

---

### **4. Connector Setup** ✅

**Per Farcaster Docs:**
\`\`\`typescript
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

export const config = createConfig({
  chains: [base],
  connectors: [
    miniAppConnector() // ✅ Always include
  ]
})
\`\`\`

**Implementasi:**
\`\`\`typescript
// ✅ CORRECT: Always include connector
connectors: [
  farcasterMiniApp(), // Handles environment detection internally
  injected(),         // Fallback for web browser
]
\`\`\`

**Alasan:**
- Connector handle environment detection secara internal
- Tidak perlu conditional - connector akan graceful fail jika tidak di miniapp
- Always include untuk hybrid mode support

---

## 🔧 **Implementation Details**

### **Auto-Connect Flow**

\`\`\`
1. App loads in miniapp
   ↓
2. Connector initialized in config
   ↓
3. Connector auto-connects (if user has wallet)
   ↓
4. useAccount().isConnected = true
   ↓
5. UI shows connected state
\`\`\`

**Jika auto-connect tidak terjadi:**
\`\`\`
1. Wait 500ms for auto-connect
   ↓
2. Check isConnected
   ↓
3. If still false, manually connect
   ↓
4. User prompted by Farcaster client
\`\`\`

---

### **Manual Connect Flow**

\`\`\`
1. User clicks "Connect Wallet"
   ↓
2. Find Farcaster connector
   ↓
3. Call connect({ connector: fcConnector })
   ↓
4. Farcaster client shows wallet selection/connection
   ↓
5. User approves connection
   ↓
6. isConnected = true
\`\`\`

---

## 📋 **Best Practices Checklist**

### ✅ **Connection Handling**
- [x] Check `isConnected` before assuming connection
- [x] Wait for auto-connect before manual connect
- [x] Handle both auto-connect and manual connect
- [x] Show appropriate UI states

### ✅ **Connector Setup**
- [x] Always include `farcasterMiniApp()` connector
- [x] Include `injected()` as fallback
- [x] Connector handles environment detection

### ✅ **User Experience**
- [x] No wallet selection dialog needed
- [x] Farcaster client handles wallet UI
- [x] Show connection status clearly
- [x] Prompt to connect if not connected

### ✅ **Error Handling**
- [x] Handle connector not found
- [x] Handle connection failures
- [x] Fallback to manual connect
- [x] Log errors for debugging

---

## 🐛 **Troubleshooting**

### **Issue: Connector Not Auto-Connecting**

**Symptoms:**
- `isConnected` stays `false`
- Manual connect works

**Possible Causes:**
1. User doesn't have wallet connected in Farcaster
2. Connector not ready yet
3. SDK not initialized

**Solutions:**
1. ✅ Wait for connector to be ready (`connector.ready`)
2. ✅ Check if SDK is initialized
3. ✅ Manual connect will prompt user to connect wallet

---

### **Issue: Manual Connect Not Working**

**Symptoms:**
- Click "Connect Wallet" but nothing happens
- No error in console

**Possible Causes:**
1. Connector not found
2. Connector not ready
3. Farcaster client not responding

**Solutions:**
1. ✅ Check connector is in `connectors` array
2. ✅ Check `connector.ready` is `true`
3. ✅ Check console for errors
4. ✅ Verify app is in miniapp environment

---

### **Issue: Connection State Not Updating**

**Symptoms:**
- Wallet connected but `isConnected` is `false`
- UI shows "Connect Wallet" even though connected

**Possible Causes:**
1. Wagmi state not syncing
2. React re-render issue
3. Connector state mismatch

**Solutions:**
1. ✅ Check `useAccount()` hook is used correctly
2. ✅ Verify WagmiProvider is wrapping app
3. ✅ Check React DevTools for state
4. ✅ Refresh app to reset state

---

## 📚 **Code Examples**

### **Example 1: Check Connection**

\`\`\`typescript
import { useAccount } from 'wagmi';

function MyComponent() {
  const { isConnected, address } = useAccount();
  
  if (isConnected) {
    return <div>Connected: {address}</div>;
  }
  
  return <button onClick={handleConnect}>Connect Wallet</button>;
}
\`\`\`

---

### **Example 2: Manual Connect**

\`\`\`typescript
import { useConnect } from 'wagmi';

function ConnectButton() {
  const { connect, connectors } = useConnect();
  
  const handleConnect = () => {
    const fcConnector = connectors.find(c => 
      c.id === "farcasterMiniApp" || c.id === "io.farcaster.miniapp"
    );
    
    if (fcConnector) {
      connect({ connector: fcConnector });
    }
  };
  
  return <button onClick={handleConnect}>Connect</button>;
}
\`\`\`

---

### **Example 3: Auto-Connect Hook**

\`\`\`typescript
function useAutoConnect() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  useEffect(() => {
    // Wait for auto-connect
    if (isConnected) return;
    
    // Manual connect if auto-connect didn't happen
    const timer = setTimeout(() => {
      const fcConnector = connectors.find(/* ... */);
      if (fcConnector?.ready) {
        connect({ connector: fcConnector });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isConnected, connect, connectors]);
}
\`\`\`

---

## 🔗 **Referensi**

- [Farcaster Wallet Guide](https://miniapps.farcaster.xyz/docs/guides/wallets)
- [Wagmi Getting Started](https://wagmi.sh/react/getting-started)
- [Farcaster Miniapp SDK](https://miniapps.farcaster.xyz/docs/sdk)

---

## ✅ **Summary**

Implementasi saat ini **100% compliant** dengan dokumentasi Farcaster:

1. ✅ Connector auto-connects jika user punya wallet
2. ✅ Manual connect hanya jika auto-connect tidak terjadi
3. ✅ Tidak perlu wallet selection dialog
4. ✅ Always check connection state
5. ✅ Proper error handling
6. ✅ Hybrid mode support (miniapp + web)

**Status: ✅ Production Ready**
