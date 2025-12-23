# 🔧 Premium RPC Setup Guide

## Masalah: Error 429 (Too Many Requests)

Jika Anda masih mengalami error 429 setelah menggunakan RPC gratis, solusi terbaik adalah menggunakan **RPC Premium** dengan API key.

---

## 🎯 **Perbedaan: Etherscan API vs RPC Endpoint**

### ❌ **Etherscan/Basescan API** (TIDAK BISA digunakan sebagai RPC)
- **Fungsi**: Membaca data blockchain (transaction history, events, balances)
- **TIDAK BISA**: Query contract state, execute transactions
- **Rate Limit**: 5 requests/second (free tier)
- **Link**: https://etherscan.io/apidashboard

### ✅ **RPC Endpoint** (Yang kita butuhkan)
- **Fungsi**: Query contract state, execute transactions
- **Contoh**: `contract.reminders(id)`, `contract.nextReminderId()`
- **Rate Limit**: Tergantung provider (premium = unlimited/higher limits)

**Kesimpulan**: Etherscan API tidak bisa menggantikan RPC endpoint untuk kebutuhan kita.

---

## 💎 **Solusi: RPC Premium Providers**

### **Option 1: Alchemy (Recommended)**

1. **Daftar**: https://www.alchemy.com/
2. **Create App**: Pilih "Base" network
3. **Get API Key**: Copy HTTP URL
4. **Format**: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

**Pricing**:
- **Free Tier**: 300M compute units/month
- **Growth**: $49/month (350M compute units)
- **Scale**: $199/month (1B compute units)

**Link**: https://www.alchemy.com/pricing

---

### **Option 2: Infura**

1. **Daftar**: https://www.infura.io/
2. **Create Project**: Pilih "Base" network
3. **Get API Key**: Copy HTTPS endpoint
4. **Format**: `https://base-mainnet.infura.io/v3/YOUR_API_KEY`

**Pricing**:
- **Free Tier**: 100k requests/day
- **Developer**: $50/month (5M requests/day)
- **Team**: $200/month (25M requests/day)

**Link**: https://www.infura.io/pricing

---

### **Option 3: QuickNode**

1. **Daftar**: https://www.quicknode.com/
2. **Create Endpoint**: Pilih "Base" network
3. **Get HTTP URL**: Copy endpoint URL

**Pricing**:
- **Free Tier**: 10M requests/month
- **Build**: $49/month (100M requests)
- **Scale**: $299/month (1B requests)

**Link**: https://www.quicknode.com/pricing

---

## ⚙️ **Setup di Vercel**

### **Step 1: Dapatkan API Key**

Pilih salah satu provider di atas dan dapatkan API key.

### **Step 2: Set Environment Variable**

Di Vercel Dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
   - **Value**: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY` (contoh Alchemy)
3. **Save**

### **Step 3: Redeploy**

Setelah set environment variable, redeploy aplikasi:
- Vercel akan otomatis redeploy jika ada perubahan env var
- Atau manual: **Deployments** → **Redeploy**

---

## 🔍 **Cara Kerja**

Setelah environment variable di-set, sistem akan:

1. **Priority 1**: Gunakan RPC premium dari `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
2. **Priority 2**: Fallback ke RPC gratis yang reliable (LlamaRPC, PublicNode, dll)
3. **Priority 3**: Fallback ke official Base RPC (jika semua gagal)

**Code Location**: `lib/utils/rpc-provider.ts`

---

## ✅ **Verifikasi**

Setelah setup, cek di browser console:
- Tidak ada error 429
- Data konsisten (tidak berubah-ubah)
- Loading lebih cepat

---

## 📊 **Perbandingan Provider**

| Provider | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Alchemy** | 300M CU/month | $49/month | High volume apps |
| **Infura** | 100k req/day | $50/month | Simple apps |
| **QuickNode** | 10M req/month | $49/month | Global distribution |

**CU** = Compute Units (Alchemy's billing metric)

---

## 💡 **Tips**

1. **Start with Free Tier**: Coba free tier dulu, upgrade jika perlu
2. **Monitor Usage**: Cek dashboard provider untuk usage
3. **Multiple Keys**: Bisa setup multiple keys untuk redundancy
4. **Rate Limiting**: Premium providers biasanya tidak ada rate limiting (atau sangat tinggi)

---

## 🆘 **Troubleshooting**

### Error: "Invalid API Key"
- Pastikan API key benar
- Pastikan network adalah "Base Mainnet" (bukan Ethereum)
- Cek format URL sesuai provider

### Masih Error 429
- Pastikan environment variable sudah di-set
- Pastikan sudah redeploy setelah set env var
- Cek di Vercel logs apakah RPC premium digunakan

---

## 📚 **Resources**

- **Alchemy**: https://www.alchemy.com/
- **Infura**: https://www.infura.io/
- **QuickNode**: https://www.quicknode.com/
- **Basescan API** (untuk data tambahan): https://basescan.org/apis

---

**Status**: ✅ Ready to use  
**Last Updated**: December 22, 2025

