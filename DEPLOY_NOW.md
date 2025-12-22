# 🚀 Deploy Sekarang - Quick Guide

## ✅ **Status: SIAP DEPLOY!**

Semua code sudah siap. Tinggal deploy!

---

## 📋 **Checklist Sebelum Deploy**

### **1. Environment Variables di Vercel** ⚠️ PENTING!

**Paling penting:** Update `NEXT_PUBLIC_VAULT_CONTRACT` ke V4 address!

**Via Vercel Dashboard:**
1. Login ke https://vercel.com
2. Pilih project Anda
3. **Settings** → **Environment Variables**
4. Cari `NEXT_PUBLIC_VAULT_CONTRACT`
5. **Edit** value ke: `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
6. Pilih: **Production**, **Preview**, **Development**
7. **Save**

**Verify semua variables ada:**
- ✅ `NEXT_PUBLIC_VAULT_CONTRACT` = `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
- ✅ `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- ✅ `NEXT_PUBLIC_TOKEN_ADDRESS` = `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- ✅ `NEYNAR_API_KEY` = (your key)
- ✅ `CRON_SECRET` = (your secret)
- ✅ `CRON_WALLET_PRIVATE_KEY` = (your private key)

---

## 🚀 **Langkah Deploy**

### **Step 1: Build Check (Optional tapi recommended)**

```bash
npm run build
```

**Jika ada error, fix dulu. Jika success, lanjut!**

### **Step 2: Commit & Push**

```bash
# Stage semua changes
git add .

# Commit
git commit -m "Deploy V4 contract integration - Ready for production"

# Push
git push
```

### **Step 3: Deploy**

**Jika Vercel connected ke Git (auto-deploy):**
- ✅ Vercel akan auto-deploy setelah push
- Check status di Vercel dashboard

**Jika manual deploy:**
```bash
vercel --prod
```

### **Step 4: Redeploy (Jika update env vars)**

**Setelah update environment variables:**
- Go to Vercel Dashboard
- **Deployments** → **Redeploy** latest deployment
- Atau: `vercel --prod` lagi

---

## ✅ **Setelah Deploy - Test**

### **1. Test Web Browser:**
- Buka production URL
- Connect wallet
- Test create reminder

### **2. Test Farcaster Miniapp:**
- Buka Warpcast
- Test miniapp
- Verify auto-connect

---

## ⚠️ **Penting!**

**Sebelum deploy, pastikan:**
- [ ] Environment variables di Vercel sudah di-update
- [ ] `NEXT_PUBLIC_VAULT_CONTRACT` = V4 address
- [ ] Semua required variables ada

**Setelah deploy:**
- [ ] Test di production
- [ ] Monitor logs untuk errors
- [ ] Fix issues jika ada

---

## 🎯 **Quick Commands**

```bash
# 1. Build check
npm run build

# 2. Commit & push
git add . && git commit -m "Deploy V4" && git push

# 3. Deploy (if manual)
vercel --prod
```

---

## ✅ **Summary**

**Status:** ✅ **READY TO DEPLOY!**

**Yang Sudah Done:**
- ✅ V4 functions implemented
- ✅ Code fixed
- ✅ No errors

**Yang Perlu Anda Lakukan:**
1. ✅ Update Vercel environment variables (V4 address)
2. ✅ Commit & push code
3. ✅ Deploy (auto atau manual)
4. ✅ Test di production

---

**Siap deploy! 🚀**

**Last Updated:** December 22, 2025

