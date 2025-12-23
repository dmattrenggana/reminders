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
- **API Key**: Bisa digunakan untuk data tambahan (bukan RPC)

**Catatan Penting**: 
- Etherscan API key **TIDAK BISA** digunakan sebagai RPC endpoint
- API key ini hanya untuk membaca data dari explorer (transaction history, events, dll)
- Untuk RPC calls, Anda tetap perlu provider seperti Alchemy/Infura

### ✅ **RPC Endpoint** (Yang kita butuhkan)
- **Fungsi**: Query contract state, execute transactions
- **Contoh**: `contract.reminders(id)`, `contract.nextReminderId()`
- **Rate Limit**: Tergantung provider (premium = unlimited/higher limits)
- **Provider**: Alchemy, Infura, QuickNode (bukan Etherscan)

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

### **Option 3: QuickNode (Recommended for Production)**

1. **Daftar**: https://www.quicknode.com/
2. **Login**: Masuk ke QuickNode Dashboard
3. **Create Endpoint**:
   - Klik "Create Endpoint" atau "Add Endpoint"
   - Pilih **"Base"** network (Chain ID: 8453)
   - Pilih plan (Free, Build, atau Scale)
   - Klik "Create Endpoint"
4. **Get HTTP URL**:
   - Setelah endpoint dibuat, copy **HTTP URL**
   - Format: `https://YOUR-ENDPOINT-NAME.base.quiknode.pro/YOUR-API-KEY/`
   - Contoh: `https://your-endpoint-name.base.quiknode.pro/abc123def456/`
5. **API Key**:
   - API key ada di akhir URL (setelah `/`)
   - Atau bisa dilihat di QuickNode Dashboard → Endpoints → Your Endpoint → API Key

**Pricing**:
- **Free Tier**: 10M requests/month
- **Build**: $49/month (100M requests)
- **Scale**: $299/month (1B requests)

**Link**: 
- **Dashboard**: https://www.quicknode.com/dashboard
- **Pricing**: https://www.quicknode.com/pricing
- **Docs**: https://www.quicknode.com/docs/console-api

**Keuntungan QuickNode**:
- ✅ Global distribution (multiple regions)
- ✅ High reliability (99.9% uptime)
- ✅ Fast response times
- ✅ Good for production apps

---

## ⚙️ **Setup QuickNode (Step-by-Step)**

### **Step 1: Login ke QuickNode Dashboard**

1. Buka: https://www.quicknode.com/
2. Login atau Sign Up (jika belum punya akun)
3. Setelah login, Anda akan masuk ke Dashboard

### **Step 2: Create Endpoint untuk Base**

1. Di Dashboard, klik **"Create Endpoint"** atau **"Add Endpoint"**
2. Pilih **"Base"** network (Chain ID: 8453)
3. Pilih plan:
   - **Free**: 10M requests/month (cukup untuk testing)
   - **Build**: $49/month (100M requests) - recommended untuk production
   - **Scale**: $299/month (1B requests) - untuk high traffic
4. Klik **"Create Endpoint"**

### **Step 3: Copy HTTP URL**

Setelah endpoint dibuat:
1. Di Dashboard, klik endpoint yang baru dibuat
2. Copy **HTTP URL** (format: `https://YOUR-ENDPOINT-NAME.base.quiknode.pro/YOUR-API-KEY/`)
3. **Contoh**: `https://your-endpoint-name.base.quiknode.pro/abc123def456/`

**Catatan**: 
- URL sudah termasuk API key di akhir
- Simpan URL ini dengan aman (jangan share publicly)

### **Step 4: Set di Vercel**

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
   - **Value**: Paste HTTP URL dari QuickNode (contoh: `https://your-endpoint-name.base.quiknode.pro/abc123def456/`)
3. **Save**

### **Step 5: Redeploy**

Setelah set environment variable:
- Vercel akan otomatis redeploy
- Atau manual: Deployments → Redeploy

### **Step 6: Verifikasi**

Setelah redeploy, cek:
- Browser console: tidak ada error 429
- Data loading lebih cepat
- Data konsisten (tidak berubah-ubah)

---

## ⚙️ **Setup di Vercel (General)**

### **Step 1: Dapatkan API Key**

Pilih salah satu provider di atas dan dapatkan API key.

### **Step 2: Set Environment Variable**

Di Vercel Dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`
   - **Value**: 
     - **Alchemy**: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
     - **Infura**: `https://base-mainnet.infura.io/v3/YOUR_API_KEY`
     - **QuickNode**: `https://YOUR-ENDPOINT-NAME.base.quiknode.pro/YOUR-API-KEY/`
3. **Save**

**Contoh untuk QuickNode**:
\`\`\`
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://your-endpoint-name.base.quiknode.pro/abc123def456/
\`\`\`

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
| **QuickNode** | 10M req/month | $49/month | Global distribution, Production apps ⭐ |

**CU** = Compute Units (Alchemy's billing metric)

---

## 💡 **Tips**

1. **Start with Free Tier**: Coba free tier dulu, upgrade jika perlu
2. **Monitor Usage**: Cek dashboard provider untuk usage
3. **Multiple Keys**: Bisa setup multiple keys untuk redundancy
4. **Rate Limiting**: Premium providers biasanya tidak ada rate limiting (atau sangat tinggi)

---

## 🔧 **QuickNode Console API (Programmatic Endpoint Management)**

### **Apa itu Console API?**

QuickNode Console API memungkinkan Anda untuk:
- ✅ Create endpoints secara programmatic
- ✅ List dan manage endpoints
- ✅ Monitor usage dan metrics
- ✅ Automate endpoint management

### **Setup Console API Key**

1. **Generate Console API Key**:
   - Login ke QuickNode Dashboard: https://www.quicknode.com/dashboard
   - Go to **Settings** → **API Keys**
   - Generate new Console API key
   - Copy API key

2. **Set Environment Variable**:
   - Di Vercel: Add `QUICKNODE_CONSOLE_API_KEY`
   - Value: Console API key Anda
   - **Note**: Console API key berbeda dari RPC endpoint URL

### **API Routes yang Tersedia**

Setelah `QUICKNODE_CONSOLE_API_KEY` di-set, Anda bisa menggunakan:

**1. List Endpoints**:
\`\`\`bash
GET /api/quicknode/endpoints
GET /api/quicknode/endpoints?chain=base&network=mainnet
\`\`\`

**2. Create Endpoint**:
\`\`\`bash
POST /api/quicknode/endpoints
Body: {
  "chain": "base",
  "network": "mainnet",
  "label": "My Base Endpoint"
}
\`\`\`

**3. Base Mainnet Endpoint Management**:
\`\`\`bash
# Get or find Base Mainnet endpoint
GET /api/quicknode/endpoints/base

# Create Base Mainnet endpoint (auto)
GET /api/quicknode/endpoints/base?create=true
POST /api/quicknode/endpoints/base
\`\`\`

**4. Usage Statistics**:
\`\`\`bash
GET /api/quicknode/usage
GET /api/quicknode/usage?period=month
\`\`\`

### **Usage di Code**

\`\`\`typescript
import { createQuickNodeConsoleClient } from "@/lib/utils/quicknode-console";

const client = createQuickNodeConsoleClient();

// List all endpoints
const endpoints = await client.listEndpoints();

// Find Base Mainnet endpoint
const baseEndpoint = await client.findBaseEndpoint();

// Create Base Mainnet endpoint if not exists
const newEndpoint = await client.createBaseEndpoint("My Base Endpoint");

// Get Base RPC URL (auto-create if needed)
const rpcUrl = await client.getBaseRpcUrl(true);

// Get usage statistics
const usage = await client.getUsage();
\`\`\`

### **Documentation**

- **QuickNode Console API**: https://www.quicknode.com/docs/console-api
- **Create Endpoint**: https://www.quicknode.com/docs/console-api/endpoints/v0-endpoints-post

**Note**: Console API untuk management/monitoring. Untuk RPC calls, gunakan RPC endpoint URL di `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`.

---

## 🆘 **Troubleshooting**

### Error: "Invalid API Key"
- Pastikan API key benar
- Pastikan network adalah "Base Mainnet" (bukan Ethereum)
- Cek format URL sesuai provider
- Untuk Console API: pastikan `QUICKNODE_CONSOLE_API_KEY` sudah di-set

### Masih Error 429
- Pastikan environment variable sudah di-set
- Pastikan sudah redeploy setelah set env var
- Cek di Vercel logs apakah RPC premium digunakan
- Gunakan Console API untuk create endpoint baru jika perlu

### Console API Error
- Pastikan `QUICKNODE_CONSOLE_API_KEY` sudah di-set di Vercel
- Pastikan API key valid dan tidak expired
- Cek QuickNode Dashboard untuk API key status

---

## 📚 **Resources**

- **Alchemy**: https://www.alchemy.com/
- **Infura**: https://www.infura.io/
- **QuickNode**: https://www.quicknode.com/
- **Basescan API** (untuk data tambahan): https://basescan.org/apis
- **Etherscan API Docs**: https://docs.etherscan.io/

---

## ⚠️ **Catatan tentang Etherscan API Key**

Jika Anda sudah punya Etherscan API key (seperti `AV1B6NTY8FNTUZ3V5D2NKMP32EEUS8BBIB`):

### ✅ **Bisa digunakan untuk:**
- Membaca transaction history
- Membaca contract events
- Membaca token balances
- Data analytics dari blockchain explorer

### ❌ **TIDAK bisa digunakan untuk:**
- RPC endpoint (query contract state)
- Execute transactions
- Real-time contract calls

### 💡 **Solusi:**
Untuk RPC endpoint, Anda tetap perlu:
1. **Alchemy** (recommended) - https://www.alchemy.com/
2. **Infura** - https://www.infura.io/
3. **QuickNode** - https://www.quicknode.com/

Etherscan API key bisa digunakan untuk fitur tambahan (jika diperlukan), tapi tidak untuk RPC calls.

---

**Status**: ✅ Ready to use  
**Last Updated**: December 22, 2025
