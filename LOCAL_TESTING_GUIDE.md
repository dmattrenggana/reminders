# 🧪 Local Testing Guide - Reminders App

## 📋 **Prerequisites**

Sebelum mulai, pastikan Anda punya:
- ✅ Node.js **22.11.0 or higher** (cek: `node --version`)
- ✅ npm atau pnpm
- ✅ MetaMask atau wallet lain yang support Base Mainnet
- ✅ Sedikit ETH di Base Mainnet (untuk gas fees)
- ✅ Token CMIT/RMND (untuk testing create reminder)

---

## 🚀 **Step 1: Setup Environment Variables**

### **1.1. Buat file `.env.local`**

Di root project, buat file baru bernama `.env.local` (persis tanpa typo):

```bash
# Di terminal:
touch .env.local

# Atau di Windows PowerShell:
New-Item .env.local -ItemType File
```

### **1.2. Copy isi ini ke `.env.local`:**

```env
# Contract Addresses (Base Mainnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6

# RPC URL (Optional - has fallback)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

**⚠️ PENTING:** File harus bernama `.env.local` (dengan titik di depan!)

---

## 📦 **Step 2: Install Dependencies**

```bash
# Install dependencies
npm install

# Atau jika pakai pnpm:
pnpm install
```

**Expected output:**
```
added XXX packages in XXs
```

**Jika ada error:**
```bash
# Hapus node_modules dan lock file
rm -rf node_modules package-lock.json

# Install ulang
npm install
```

---

## 🏃 **Step 3: Run Development Server**

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.0.7
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

**Buka browser:** http://localhost:3000

---

## ✅ **Step 4: Testing - Web Mode (Browser Biasa)**

### **4.1. Verify App Loads**

✅ **Check:**
- [ ] Dashboard muncul tanpa error
- [ ] Tidak ada infinite loading screen
- [ ] UI components render dengan benar

❌ **Jika error:**
- Check browser console (F12 → Console)
- Check terminal untuk error messages
- Verify `.env.local` ada dan benar

---

### **4.2. Test Wallet Connection (Web Mode)**

1. **Click "Connect Wallet" button**
   
2. **Expected behavior:**
   - MetaMask popup muncul
   - Atau wallet extension lain yang terinstall
   
3. **Connect wallet dan switch to Base Mainnet:**
   ```
   Network: Base Mainnet
   Chain ID: 8453
   RPC: https://mainnet.base.org
   ```

4. **After connection:**
   - ✅ Address Anda muncul di header
   - ✅ Token balance muncul (jika punya CMIT/RMND)
   - ✅ "Connected" status visible

---

### **4.3. Check Console for Connector Detection**

**Open Browser Console (F12 → Console):**

```javascript
// Check environment
console.log('Is MiniApp?', window.Farcaster !== undefined)
// Should show: false (karena di browser biasa)

// Check available connectors (setelah connect)
// Akan muncul di console log otomatis:
// "Using injected connector for web"
```

---

### **4.4. Test Contract Interaction**

#### **4.4.1. Check Contract Connection**

Open console dan test:

```javascript
// Should show contract addresses
console.log('Token:', '0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07')
console.log('Vault:', '0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6')
```

#### **4.4.2. Check Token Balance**

- ✅ Balance should appear in header
- ✅ Symbol should show "RMNDtest" or "CMIT"

**To verify manually:**
```javascript
// Open console
// Token balance akan otomatis fetch dan display
```

---

### **4.5. Test Create Reminder (If you have tokens)**

⚠️ **Warning:** Ini akan gunakan **REAL tokens** di Base Mainnet!

1. **Click "New Reminder" button** (floating button di bawah)

2. **Fill form:**
   - Task description: "Test reminder lokal"
   - Amount: "1" (atau berapa pun)
   - Deadline: Pilih waktu (1 jam ke depan)

3. **Click "Lock & Commit"**

4. **Expected flow:**
   ```
   Step 1: Approve transaction (jika belum approve)
   → MetaMask popup: "Approve CMIT spending"
   → Confirm
   
   Step 2: Create reminder transaction
   → MetaMask popup: "Lock tokens"
   → Confirm
   
   Step 3: Success!
   → Reminder muncul di dashboard
   → Token balance berkurang
   ```

5. **Verify:**
   - ✅ Reminder muncul di "My Feed" tab
   - ✅ Status: "ACTIVE"
   - ✅ Locked amount correct

---

## 🔍 **Step 5: Advanced Testing - Contract Calls**

### **5.1. Test dengan Browser Console**

```javascript
// Check contract imports (di console DevTools)
// Ini akan error karena module, tapi cukup untuk verify setup

// Alternative: Add console.log in code
```

### **5.2. Verify Reminders Loading**

1. **Check "Public Feed" tab**
   - Should show all active reminders
   
2. **Check "My Feed" tab**
   - Should show only your reminders

3. **Stats should update:**
   - Total Tasks
   - Locked tokens
   - Completed count

---

## 🐛 **Troubleshooting Common Issues**

### **Issue 1: "Module not found" errors**

**Cause:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### **Issue 2: "Cannot find contract address"**

**Cause:** `.env.local` not loaded

**Check:**
```bash
# Verify file exists
ls -la | grep .env.local

# Should show:
# .env.local
```

**Solution:**
1. Make sure file is named `.env.local` (with dot!)
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear Next.js cache: `rm -rf .next`

---

### **Issue 3: Wallet won't connect**

**Cause:** Network mismatch or MetaMask locked

**Solution:**
1. Open MetaMask
2. Make sure you're on **Base Mainnet**
3. If not, add Base Mainnet:
   - Network Name: Base Mainnet
   - RPC URL: https://mainnet.base.org
   - Chain ID: 8453
   - Currency Symbol: ETH
   - Block Explorer: https://basescan.org

---

### **Issue 4: "Infinite loading screen"**

**Cause:** `sdk.actions.ready()` not called (tapi ini sudah fixed di refactoring)

**Check:**
```typescript
// Should exist in farcaster-provider.tsx
await sdk.actions.ready({});
```

**Already fixed!** ✅

---

### **Issue 5: Token balance shows 0**

**Cause:** 
- You don't have CMIT/RMND tokens
- Wrong network

**Solution:**
1. **Check you have tokens:**
   - Go to: https://basescan.org/address/YOUR_ADDRESS
   - Check token holdings
   
2. **Get tokens** (ask token contract owner to mint)

3. **Verify contract address:**
   ```
   Token: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
   ```

---

## 📊 **Testing Checklist**

### **Basic Tests:**
- [ ] App loads at http://localhost:3000
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Connect wallet works (MetaMask)
- [ ] Wallet address shows in header
- [ ] Token balance displays

### **Advanced Tests:**
- [ ] Token balance is correct
- [ ] Can see public reminders
- [ ] Can see my reminders
- [ ] Stats update correctly
- [ ] Create reminder works (if have tokens)
- [ ] Approve flow works
- [ ] Transaction confirms

### **Environment Detection:**
- [ ] Console shows "Using injected connector for web"
- [ ] `window.Farcaster` is undefined
- [ ] Web mode working correctly

---

## 🎯 **What to Look For**

### **✅ Success Indicators:**

1. **In Terminal:**
   ```
   ✓ Compiled successfully
   ✓ Ready in XXms
   ```

2. **In Browser:**
   - Dashboard loads
   - No red errors in console
   - Connect wallet works

3. **In Console:**
   ```
   Environment: Web
   Using injected connector for web
   ```

### **❌ Error Indicators:**

1. **In Terminal:**
   ```
   ✗ Module not found
   ✗ Cannot find name 'process'
   ```
   → Run: `npm install`

2. **In Browser Console:**
   ```
   Error: Contract addresses not configured
   ```
   → Check `.env.local` file

3. **Network Errors:**
   ```
   Failed to fetch reminders
   ```
   → Check RPC URL or network connection

---

## 🔄 **Reset Everything (if stuck)**

```bash
# Stop dev server (Ctrl+C)

# Clear everything
rm -rf node_modules
rm -rf .next
rm package-lock.json

# Reinstall
npm install

# Restart
npm run dev
```

---

## 📝 **Test Scenarios**

### **Scenario 1: First Time User**
1. Open app → Should see dashboard
2. Click connect → MetaMask opens
3. Connect → Address appears
4. See balance → Shows 0 or actual balance

### **Scenario 2: User With Tokens**
1. Connect wallet
2. See balance > 0
3. Click "New Reminder"
4. Fill form
5. Create → Approve → Confirm
6. See reminder in "My Feed"

### **Scenario 3: Viewing Others' Reminders**
1. Go to "Public Feed"
2. See all active reminders
3. Check stats update

---

## 🚀 **Next Steps After Local Testing**

Once local testing passes:

1. ✅ **Commit changes** (if any)
2. ✅ **Deploy to Vercel** (see `DEPLOYMENT_CHECKLIST.md`)
3. ✅ **Test in Farcaster Miniapp**
4. ✅ **Monitor for errors**

---

## 📚 **Additional Resources**

- **Contract Addresses:** See `CONTRACT_ADDRESSES.md`
- **Environment Setup:** See `ENV_SETUP.md`
- **Deployment Guide:** See `DEPLOYMENT_CHECKLIST.md`
- **Refactoring Summary:** See `REFACTORING_SUMMARY.md`

---

## 💡 **Pro Tips**

1. **Use Browser DevTools:**
   - F12 → Console (untuk logs)
   - F12 → Network (untuk API calls)
   - F12 → Application → Local Storage (untuk stored data)

2. **Keep Terminal Open:**
   - Watch for compilation errors
   - See real-time logs

3. **Use Multiple Tabs:**
   - Tab 1: Main dashboard
   - Tab 2: Console logs
   - Tab 3: Network monitor

4. **Test Incremental:**
   - First: App loads ✅
   - Then: Wallet connects ✅
   - Then: Balance shows ✅
   - Finally: Transactions work ✅

---

**Last Updated:** December 22, 2025  
**Tested On:** Windows 11, Node.js 22.11.0  
**Status:** ✅ Ready for local testing

