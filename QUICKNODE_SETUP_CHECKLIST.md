# ✅ QuickNode Setup Checklist

## 📋 **Langkah-Langkah Setup QuickNode**

### **Step 1: Verifikasi Environment Variable** ✅

Pastikan `QUICKNODE_CONSOLE_API_KEY` sudah di-set di Vercel:

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Cek apakah `QUICKNODE_CONSOLE_API_KEY` sudah ada
3. Jika belum, tambahkan:
   - **Name**: `QUICKNODE_CONSOLE_API_KEY`
   - **Value**: Console API key dari QuickNode Dashboard
   - **Environments**: Production, Preview, Development

**Cara mendapatkan Console API Key**:
- Login ke https://www.quicknode.com/dashboard
- Go to **Settings** → **API Keys**
- Generate atau copy Console API key

---

### **Step 2: Create Base Mainnet Endpoint**

Anda punya 2 opsi:

#### **Opsi A: Create via API (Recommended)** 🚀

Setelah deploy, panggil API endpoint:

```bash
# Via curl
curl -X POST https://your-app.vercel.app/api/quicknode/endpoints/base

# Atau via browser
GET https://your-app.vercel.app/api/quicknode/endpoints/base?create=true
```

**Response akan berisi**:
```json
{
  "success": true,
  "endpoint": {
    "id": "...",
    "chain": "base",
    "network": "mainnet",
    "http_url": "https://your-endpoint-name.base.quiknode.pro/YOUR-API-KEY/",
    "wss_url": "...",
    "label": "Base Mainnet"
  }
}
```

#### **Opsi B: Create Manual di Dashboard**

1. Login ke QuickNode Dashboard: https://www.quicknode.com/dashboard
2. Klik **"Create Endpoint"** atau **"Add Endpoint"**
3. Pilih **"Base"** network
4. Pilih **"Mainnet"**
5. Pilih plan (Free/Build/Scale)
6. Klik **"Create Endpoint"**
7. Copy **HTTP URL** yang diberikan

---

### **Step 3: Set RPC Endpoint URL**

Setelah endpoint dibuat, set HTTP URL ke environment variable:

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Add atau update variable:
   - **Name**: `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
   - **Value**: HTTP URL dari endpoint (contoh: `https://your-endpoint-name.base.quiknode.pro/YOUR-API-KEY/`)
   - **Environments**: Production, Preview, Development
3. **Save**

**Format URL**:
```
https://YOUR-ENDPOINT-NAME.base.quiknode.pro/YOUR-API-KEY/
```

---

### **Step 4: Redeploy Aplikasi**

Setelah set environment variables:

1. Vercel akan otomatis redeploy jika ada perubahan env var
2. Atau manual: **Deployments** → **Redeploy Latest**

---

### **Step 5: Verifikasi Setup**

#### **A. Test API Routes**

```bash
# List endpoints
curl https://your-app.vercel.app/api/quicknode/endpoints

# Get Base endpoint
curl https://your-app.vercel.app/api/quicknode/endpoints/base

# Get usage statistics
curl https://your-app.vercel.app/api/quicknode/usage
```

#### **B. Test di Browser**

1. Buka aplikasi di browser
2. Buka Developer Console (F12)
3. Cek apakah ada error 429
4. Cek apakah data loading dengan baik
5. Cek network tab untuk RPC calls

#### **C. Cek Vercel Logs**

1. Buka Vercel Dashboard → Deployments
2. Pilih latest deployment
3. Klik **Functions** tab
4. Cek logs untuk error atau warning

---

## 🎯 **Quick Start (All-in-One)**

Jika Anda ingin setup cepat, ikuti langkah ini:

1. **Pastikan `QUICKNODE_CONSOLE_API_KEY` sudah di-set di Vercel** ✅

2. **Deploy aplikasi** (jika belum)

3. **Create Base endpoint via API**:
   ```bash
   POST https://your-app.vercel.app/api/quicknode/endpoints/base
   ```

4. **Copy `http_url` dari response**

5. **Set di Vercel**:
   - Variable: `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
   - Value: `http_url` dari step 4

6. **Redeploy**

7. **Test aplikasi**

---

## 📝 **Checklist Summary**

- [ ] `QUICKNODE_CONSOLE_API_KEY` sudah di-set di Vercel
- [ ] Base Mainnet endpoint sudah dibuat (via API atau manual)
- [ ] `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` sudah di-set dengan HTTP URL endpoint
- [ ] Aplikasi sudah di-redeploy
- [ ] Test API routes berhasil
- [ ] Test aplikasi di browser (tidak ada error 429)
- [ ] Data loading dengan baik

---

## 🔍 **Troubleshooting**

### Error: "QuickNode Console API key not configured"
- Pastikan `QUICKNODE_CONSOLE_API_KEY` sudah di-set di Vercel
- Pastikan sudah redeploy setelah set env var

### Error: "Failed to create endpoint"
- Cek apakah Console API key valid
- Cek QuickNode Dashboard untuk API key status
- Pastikan account memiliki permission untuk create endpoint

### Masih Error 429
- Pastikan `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` sudah di-set dengan QuickNode endpoint URL
- Pastikan sudah redeploy setelah set env var
- Cek Vercel logs untuk melihat RPC yang digunakan

---

## 📚 **Resources**

- **QuickNode Dashboard**: https://www.quicknode.com/dashboard
- **Console API Docs**: https://www.quicknode.com/docs/console-api
- **RPC Setup Guide**: `docs/RPC_PREMIUM_SETUP.md`

---

**Status**: ✅ Ready to setup  
**Last Updated**: December 22, 2025

