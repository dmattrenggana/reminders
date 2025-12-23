# 🔧 QuickNode 401 Unauthorized Error - Fix Guide

## 📋 **Error yang Terjadi**

```
POST https://ultra-withered-field.base-mainnet.quiknode.pro/QN_5f9ce2d85b794f42a5bd28d4f0e909e7/ 
401 (Unauthorized)
```

## 🔍 **Penyebab Error 401**

Error 401 (Unauthorized) dari QuickNode biasanya disebabkan oleh:

1. **API Key tidak valid atau expired**
2. **Endpoint di-pause atau tidak aktif**
3. **Format URL salah** (meskipun terlihat benar)
4. **Endpoint dihapus atau tidak ada**
5. **Account tidak memiliki permission**

---

## ✅ **Solusi Step-by-Step**

### **Step 1: Verifikasi Endpoint di QuickNode Dashboard**

1. Login ke QuickNode Dashboard: https://www.quicknode.com/dashboard
2. Go to **Endpoints**
3. Cari endpoint dengan nama: `ultra-withered-field`
4. Cek status endpoint:
   - ✅ **Active** - Endpoint aktif
   - ⚠️ **Paused** - Endpoint di-pause (unpause dulu)
   - ❌ **Deleted** - Endpoint dihapus (buat baru)

### **Step 2: Verifikasi HTTP URL**

1. Di QuickNode Dashboard, klik endpoint
2. Copy **HTTP URL** yang benar
3. Format harus: `https://YOUR-ENDPOINT-NAME.base-mainnet.quiknode.pro/YOUR-API-KEY/`
4. Pastikan ada trailing slash `/` di akhir

### **Step 3: Verifikasi Environment Variable**

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Cek `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`:
   - Value harus sama persis dengan HTTP URL dari QuickNode Dashboard
   - Pastikan tidak ada spasi di awal/akhir
   - Pastikan ada trailing slash `/`

### **Step 4: Test Endpoint Manual**

Test endpoint dengan curl untuk verifikasi:

```bash
curl -X POST https://ultra-withered-field.base-mainnet.quiknode.pro/QN_5f9ce2d85b794f42a5bd28d4f0e909e7/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected Response** (success):
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

**Error Response** (401):
```json
{"error": "Unauthorized"}
```

### **Step 5: Create Endpoint Baru (Jika Perlu)**

Jika endpoint tidak valid atau dihapus:

#### **Opsi A: Via API**

```bash
POST https://your-app.vercel.app/api/quicknode/endpoints/base
```

#### **Opsi B: Manual di Dashboard**

1. QuickNode Dashboard → Create Endpoint
2. Pilih **Base** → **Mainnet**
3. Copy HTTP URL baru
4. Update `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` di Vercel

---

## 🔄 **Langkah-Langkah Fix**

### **Fix 1: Unpause Endpoint (Jika Paused)**

1. QuickNode Dashboard → Endpoints
2. Klik endpoint yang paused
3. Klik **"Unpause"** atau **"Resume"**

### **Fix 2: Regenerate API Key (Jika Invalid)**

1. QuickNode Dashboard → Endpoints
2. Klik endpoint
3. Go to **Security** tab
4. Regenerate API key
5. Copy HTTP URL baru
6. Update di Vercel

### **Fix 3: Create Endpoint Baru**

Jika endpoint tidak bisa diperbaiki:

1. **Via API** (Recommended):
   ```bash
   POST /api/quicknode/endpoints/base
   ```

2. **Manual**:
   - QuickNode Dashboard → Create Endpoint
   - Base → Mainnet
   - Copy HTTP URL
   - Update `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`

### **Fix 4: Update Environment Variable**

1. Vercel Dashboard → Environment Variables
2. Edit `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
3. Paste HTTP URL baru dari QuickNode
4. **Save**
5. **Redeploy**

---

## 🧪 **Verifikasi Setelah Fix**

### **1. Test Endpoint Manual**

```bash
curl -X POST YOUR_QUICKNODE_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### **2. Test di Browser**

1. Buka aplikasi
2. Open Developer Console (F12)
3. Cek Network tab
4. Tidak ada error 401
5. RPC calls berhasil

### **3. Test API Route**

```bash
# Get endpoint info
GET /api/quicknode/endpoints/base

# Should return endpoint with http_url
```

---

## 📝 **Checklist Troubleshooting**

- [ ] Endpoint status = Active (bukan Paused/Deleted)
- [ ] HTTP URL di Vercel sama dengan di QuickNode Dashboard
- [ ] HTTP URL memiliki trailing slash `/`
- [ ] Tidak ada spasi di awal/akhir URL
- [ ] API key valid (test dengan curl)
- [ ] Environment variable sudah di-update
- [ ] Aplikasi sudah di-redeploy setelah update env var

---

## 🆘 **Jika Masih Error**

### **Error: "Endpoint not found"**
- Endpoint mungkin dihapus
- Create endpoint baru

### **Error: "Invalid API key"**
- Regenerate API key di QuickNode Dashboard
- Update HTTP URL di Vercel

### **Error: "Account limit reached"**
- Cek plan QuickNode (free tier mungkin terbatas)
- Upgrade plan jika perlu

### **Error: "Endpoint paused"**
- Unpause endpoint di QuickNode Dashboard

---

## 📚 **Resources**

- **QuickNode Dashboard**: https://www.quicknode.com/dashboard
- **QuickNode Support**: https://www.quicknode.com/support
- **Console API Docs**: https://www.quicknode.com/docs/console-api

---

**Status**: ✅ Troubleshooting Guide  
**Last Updated**: December 22, 2025

