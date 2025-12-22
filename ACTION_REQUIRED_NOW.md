# 🎯 Action Required - Langkah Selanjutnya

**Status:** Contract V4 sudah di-deploy ✅  
**Address:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f`

---

## 📋 **Checklist Langkah-Langkah**

### **1. Update Environment Variables** ⚠️ PENTING

#### **A. Local Development (.env.local)**

Buat atau update file `.env.local` di root project:

```env
# Token Contract (tidak berubah)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07

# Vault Contract V4 (BARU!)
NEXT_PUBLIC_VAULT_CONTRACT=0x2e3A524912636BF456B3C19f88693087c4dAa25f

# RPC URL (Optional - has fallback to https://mainnet.base.org)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# API Keys (Required for helper rewards & cron jobs)
# Get from: https://neynar.com
NEYNAR_API_KEY=your_neynar_api_key_here

# Optional: If different from NEYNAR_API_KEY
# FARCASTER_API_KEY=your_farcaster_api_key_here

# Required: For secure cron jobs (generate: openssl rand -base64 32)
CRON_SECRET=your_vercel_cron_secret_here

# Required: For cron job wallet - auto-burn missed reminders
# Create new wallet, fund with Base ETH for gas
CRON_WALLET_PRIVATE_KEY=0x_your_private_key_here
```

**Cara:**
1. Buka terminal di project root
2. Buat file: `touch .env.local` (Mac/Linux) atau `New-Item .env.local` (Windows)
3. Copy-paste isi di atas
4. Save file

#### **B. Vercel Deployment**

**Via Vercel Dashboard:**
1. Login ke https://vercel.com
2. Pilih project `reminders-1`
3. Go to **Settings** → **Environment Variables**
4. Cari `NEXT_PUBLIC_VAULT_CONTRACT`
5. Klik **Edit**
6. Update value ke: `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
7. Pilih environments: **Production**, **Preview**, **Development**
8. Klik **Save**

**Via Vercel CLI:**
```bash
# Remove old value
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT production
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT preview
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT development

# Add new value
vercel env add NEXT_PUBLIC_VAULT_CONTRACT production
# When prompted, paste: 0x2e3A524912636BF456B3C19f88693087c4dAa25f

vercel env add NEXT_PUBLIC_VAULT_CONTRACT preview
vercel env add NEXT_PUBLIC_VAULT_CONTRACT development
```

---

### **2. Restart Development Server** 🔄

Setelah update `.env.local`:

```bash
# Stop server jika sedang running (Ctrl+C)
# Then restart:
npm run dev
```

**Verifikasi:**
- Buka http://localhost:3000
- Check browser console - tidak ada error tentang contract address
- Check Network tab - contract calls menggunakan address baru

---

### **3. Test Contract V4** 🧪

#### **A. Test Create Reminder**

1. **Connect Wallet:**
   - Klik "Connect Wallet"
   - Pilih wallet (MetaMask/Coinbase Wallet)
   - Approve connection

2. **Create Reminder:**
   - Klik floating button "+ New Reminder"
   - Isi form:
     - Description: "Test V4 Reminder"
     - Lock Amount: "100" (atau sesuai balance)
     - Deadline: Pilih waktu di masa depan
   - Klik "Lock & Commit"

3. **Verify:**
   - Approve token transaction (jika pertama kali)
   - Approve create reminder transaction
   - Check transaction di Basescan
   - Verify reminder muncul di "My Feed"

#### **B. Verify Token Split (30/70)**

Setelah create reminder:
1. Check transaction receipt di Basescan
2. Verify event `ReminderCreated` emitted
3. Check `commitAmount` = 30% dari total
4. Check `rewardPoolAmount` = 70% dari total

**Example:**
- Total locked: 1000 tokens
- Commitment: 300 tokens (30%)
- Reward Pool: 700 tokens (70%)

#### **C. Test Contract Functions**

**Via Basescan:**
1. Go to: https://basescan.org/address/0x2e3A524912636BF456B3C19f88693087c4dAa25f
2. Tab **Contract** → **Read Contract**
3. Test functions:
   - `nextReminderId()` - Should return current ID
   - `reminders(0)` - Get first reminder data
   - `getUserReminders(your_address)` - Get your reminders

---

### **4. Verify Code Changes** ✅

Semua file sudah diupdate, tapi verify:

```bash
# Check config file
cat lib/contracts/config.ts | grep "REMINDER_VAULT_ABI"

# Should show:
# export const REMINDER_VAULT_ABI = REMINDER_VAULT_V4_ABI
```

---

### **5. Test Helper Flow** (Optional)

Jika ada helper yang mau test:

1. **Helper clicks "Help Remind Me"**
2. **Post mention di Farcaster**
3. **Claim reward**
4. **Verify reward tier:**
   - Neynar score ≥ 0.9 → 10% of reward pool
   - Neynar score 0.5-0.89 → 6% of reward pool
   - Neynar score < 0.5 → 3% of reward pool

---

### **6. Deploy to Vercel** (Jika siap)

```bash
# Push changes to git
git add .
git commit -m "Update to V4 contract"
git push

# Vercel akan auto-deploy
# Atau manual:
vercel --prod
```

**Setelah deploy:**
- Verify environment variables di Vercel sudah update
- Test di production URL
- Test di Warpcast miniapp (jika sudah setup)

---

## ⚠️ **Troubleshooting**

### **Error: "Address is invalid"**
- ✅ Check `.env.local` sudah ada dan benar
- ✅ Restart dev server setelah update `.env.local`
- ✅ Verify address format: `0x2e3A524912636BF456B3C19f88693087c4dAa25f`

### **Error: "Contract function not found"**
- ✅ Verify menggunakan V4 ABI (sudah diupdate)
- ✅ Check contract address di Basescan
- ✅ Verify contract sudah verified di Basescan

### **Error: "Transaction reverted"**
- ✅ Check token balance cukup
- ✅ Check token approval sudah dilakukan
- ✅ Verify deadline di masa depan
- ✅ Check gas limit cukup

### **Reminder tidak muncul**
- ✅ Check transaction success di Basescan
- ✅ Refresh page
- ✅ Check "My Feed" tab
- ✅ Verify wallet address match dengan creator

---

## 📊 **Verification Checklist**

- [ ] `.env.local` sudah dibuat/update dengan address V4
- [ ] Dev server sudah restart
- [ ] No errors di browser console
- [ ] Contract address correct di Network tab
- [ ] Create reminder berhasil
- [ ] Token split 30/70 correct
- [ ] Reminder muncul di "My Feed"
- [ ] Vercel environment variables updated
- [ ] Production deploy successful (jika sudah)

---

## 🎯 **Priority Actions**

**MUST DO NOW:**
1. ✅ Update `.env.local` dengan address V4
2. ✅ Restart dev server
3. ✅ Test create reminder

**NEXT:**
4. Update Vercel environment variables
5. Test helper flow
6. Deploy to production

---

## 📚 **Resources**

- **Contract Address:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
- **Basescan:** https://basescan.org/address/0x2e3A524912636BF456B3C19f88693087c4dAa25f
- **Token Contract:** `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- **Documentation:** `V4_DEPLOYMENT_UPDATE.md`

---

**Status:** Ready to test! 🚀  
**Last Updated:** December 22, 2025

