# 🔍 Environment Variables - Clarification & Update Guide

## 📋 **Perbedaan Point No 5 di .env.local**

### **Perbedaan yang Ditemukan:**

**Di `ACTION_REQUIRED_NOW.md`:**
```env
# Neynar API (jika belum ada)
NEYNAR_API_KEY=your_neynar_api_key_here
```

**Di `ENV_SETUP.md`:**
```env
# API Keys (For backend features - optional)
FARCASTER_API_KEY=your_neynar_api_key_here
NEYNAR_API_KEY=your_neynar_api_key_here
CRON_SECRET=your_vercel_cron_secret_here
```

### **Penjelasan:**

1. **`NEYNAR_API_KEY`** - **REQUIRED** untuk:
   - Fetch Neynar score untuk helper rewards
   - Verify helper posts/mentions
   - Get Farcaster user data

2. **`FARCASTER_API_KEY`** - **OPTIONAL** (jika berbeda dari Neynar):
   - Beberapa setup menggunakan key terpisah
   - Biasanya sama dengan `NEYNAR_API_KEY`

3. **`CRON_SECRET`** - **REQUIRED** untuk:
   - Secure cron job endpoint (`/api/cron/process-reminders`)
   - Auto-burn missed reminders

4. **`NEXT_PUBLIC_BASE_MAINNET_RPC_URL`** - **OPTIONAL**:
   - Ada fallback ke `https://mainnet.base.org`
   - Hanya perlu jika pakai premium RPC provider

---

## ✅ **.env.local Template (LENGKAP & UPDATE V4)**

**Copy ini ke `.env.local`:**

```env
# ============================================
# CONTRACT ADDRESSES (Base Mainnet)
# ============================================
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0x2e3A524912636BF456B3C19f88693087c4dAa25f

# ============================================
# RPC URL (Optional - has fallback)
# ============================================
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# ============================================
# API KEYS (Required for features)
# ============================================
# Get from: https://neynar.com
NEYNAR_API_KEY=your_neynar_api_key_here

# Optional: If different from NEYNAR_API_KEY
# FARCASTER_API_KEY=your_farcaster_api_key_here

# Required: For secure cron jobs
# Generate random string: openssl rand -base64 32
CRON_SECRET=your_vercel_cron_secret_here

# Required: For cron job wallet (auto-burn)
# Create new wallet, fund with Base ETH for gas
CRON_WALLET_PRIVATE_KEY=0x_your_private_key_here

# ============================================
# APP URL (Optional - for redirects)
# ============================================
NEXT_PUBLIC_APP_URL=https://remindersbase.vercel.app
```

---

## 🚀 **Update Vercel Environment Variables**

### **Ya, HARUS disesuaikan setelah deploy!**

**Semua environment variables di Vercel harus diupdate:**

### **1. Update Contract Address (V4)**

**Via Dashboard:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Cari `NEXT_PUBLIC_VAULT_CONTRACT`
3. Edit value ke: `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
4. Apply ke: **Production**, **Preview**, **Development**
5. **Redeploy** setelah update

**Via CLI:**
```bash
# Remove old
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT production
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT preview
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT development

# Add new V4 address
vercel env add NEXT_PUBLIC_VAULT_CONTRACT production
# Paste: 0x2e3A524912636BF456B3C19f88693087c4dAa25f

vercel env add NEXT_PUBLIC_VAULT_CONTRACT preview
vercel env add NEXT_PUBLIC_VAULT_CONTRACT development
```

### **2. Verify All Required Variables**

**Checklist Vercel Environment Variables:**

- [x] `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- [x] `NEXT_PUBLIC_TOKEN_ADDRESS` = `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- [x] `NEXT_PUBLIC_VAULT_CONTRACT` = `0x2e3A524912636BF456B3C19f88693087c4dAa25f` ⚠️ **UPDATE INI!**
- [x] `NEYNAR_API_KEY` = (your key)
- [x] `CRON_SECRET` = (your secret)
- [x] `CRON_WALLET_PRIVATE_KEY` = (your private key)
- [ ] `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` = (optional, has fallback)

### **3. After Update - Redeploy**

```bash
# Trigger redeploy
vercel --prod

# Or via dashboard:
# Deployments → Redeploy latest
```

---

## 📊 **Environment Variables Priority**

| Variable | Required | Local | Vercel | Notes |
|----------|----------|-------|--------|-------|
| `NEXT_PUBLIC_VAULT_CONTRACT` | ✅ **YES** | ✅ | ✅ | **UPDATE to V4!** |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | ✅ YES | ✅ | ✅ | Token contract |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | ✅ YES | ✅ | ✅ | Same as above |
| `NEYNAR_API_KEY` | ✅ YES | ✅ | ✅ | For helper rewards |
| `CRON_SECRET` | ✅ YES | ✅ | ✅ | Secure cron jobs |
| `CRON_WALLET_PRIVATE_KEY` | ✅ YES | ❌ | ✅ | Auto-burn wallet |
| `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` | ⚠️ Optional | ⚠️ | ⚠️ | Has fallback |
| `FARCASTER_API_KEY` | ⚠️ Optional | ⚠️ | ⚠️ | Usually = NEYNAR |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Optional | ⚠️ | ⚠️ | For redirects |

---

## ⚠️ **Important Notes**

1. **V4 Address Update:**
   - ✅ Code sudah diupdate ke V4 ABI
   - ⚠️ **Environment variables HARUS diupdate manual**
   - ⚠️ **Vercel HARUS diupdate dan redeploy**

2. **Optional Variables:**
   - `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` - Ada fallback, tidak wajib
   - `FARCASTER_API_KEY` - Biasanya sama dengan `NEYNAR_API_KEY`
   - `NEXT_PUBLIC_APP_URL` - Hanya untuk redirects

3. **Security:**
   - ❌ **JANGAN** commit `.env.local` ke git
   - ✅ `.env.local` sudah di `.gitignore`
   - ✅ Vercel environment variables encrypted

---

## 🔄 **Update Checklist**

**Local:**
- [ ] Update `.env.local` dengan template di atas
- [ ] Update `NEXT_PUBLIC_VAULT_CONTRACT` ke V4 address
- [ ] Restart dev server

**Vercel:**
- [ ] Update `NEXT_PUBLIC_VAULT_CONTRACT` ke V4 address
- [ ] Verify semua required variables ada
- [ ] Redeploy setelah update

---

**Last Updated:** December 22, 2025  
**V4 Address:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f`

