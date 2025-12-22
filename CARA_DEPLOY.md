# 🚀 Cara Deploy dari Sini - Step by Step

## 📋 **Metode Deploy**

Ada 2 cara deploy:
1. **Via Vercel Dashboard** (Paling Mudah) ✅ Recommended
2. **Via Vercel CLI** (Command Line)

---

## 🎯 **Metode 1: Via Vercel Dashboard** (Recommended)

### **Step 1: Siapkan Repository Git**

**Jika belum ada Git repository:**

\`\`\`bash
# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - V4 contract integration"

# Create repository di GitHub/GitLab/Bitbucket
# Lalu push:
git remote add origin https://github.com/username/reminders-1.git
git push -u origin main
\`\`\`

**Jika sudah ada repository:**
\`\`\`bash
# Commit changes
git add .
git commit -m "Deploy V4 contract integration"
git push
\`\`\`

---

### **Step 2: Connect ke Vercel**

1. **Login ke Vercel:**
   - Buka: https://vercel.com
   - Login dengan GitHub/GitLab/Bitbucket

2. **Import Project:**
   - Klik **"Add New"** → **"Project"**
   - Pilih repository `reminders-1`
   - Klik **"Import"**

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detect)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   - **JANGAN deploy dulu!**
   - Klik **"Environment Variables"** section
   - Tambahkan semua variables:

   \`\`\`
   NEXT_PUBLIC_VAULT_CONTRACT = 0x2e3A524912636BF456B3C19f88693087c4dAa25f
   NEXT_PUBLIC_CONTRACT_ADDRESS = 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
   NEXT_PUBLIC_TOKEN_ADDRESS = 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
   NEXT_PUBLIC_BASE_MAINNET_RPC_URL = https://mainnet.base.org
   NEYNAR_API_KEY = (your key)
   CRON_SECRET = (your secret)
   CRON_WALLET_PRIVATE_KEY = (your private key)
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   \`\`\`

   **Untuk setiap variable:**
   - Klik **"Add"**
   - Masukkan **Key** dan **Value**
   - Pilih environments: **Production**, **Preview**, **Development**
   - Klik **"Save"**

5. **Deploy:**
   - Klik **"Deploy"**
   - Tunggu build selesai (2-5 menit)
   - ✅ Selesai!

---

### **Step 3: Setelah Deploy**

1. **Dapatkan URL:**
   - Vercel akan memberikan URL: `https://your-app.vercel.app`
   - Copy URL ini

2. **Update Environment Variable:**
   - Kembali ke **Settings** → **Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` dengan URL production Anda
   - **Redeploy** setelah update

3. **Test:**
   - Buka URL production
   - Test connect wallet
   - Test create reminder

---

## 💻 **Metode 2: Via Vercel CLI**

### **Step 1: Install Vercel CLI**

\`\`\`bash
# Install globally
npm install -g vercel

# Atau install locally
npm install vercel --save-dev
\`\`\`

### **Step 2: Login**

\`\`\`bash
vercel login
\`\`\`

- Akan membuka browser untuk login
- Authorize Vercel CLI

### **Step 3: Deploy**

\`\`\`bash
# Deploy ke preview (testing)
vercel

# Deploy ke production
vercel --prod
\`\`\`

**First time deploy:**
- Vercel akan bertanya beberapa pertanyaan:
  - **Set up and deploy?** → Yes
  - **Which scope?** → Pilih account Anda
  - **Link to existing project?** → No (untuk pertama kali)
  - **Project name?** → `reminders-1` (atau nama lain)
  - **Directory?** → `./` (default)
  - **Override settings?** → No

### **Step 4: Set Environment Variables**

\`\`\`bash
# Add environment variables
vercel env add NEXT_PUBLIC_VAULT_CONTRACT
# Paste: 0x2e3A524912636BF456B3C19f88693087c4dAa25f
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
# Paste: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_TOKEN_ADDRESS
# Paste: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
# Select: Production, Preview, Development

vercel env add NEYNAR_API_KEY
# Paste: your_neynar_api_key
# Select: Production, Preview, Development

vercel env add CRON_SECRET
# Paste: your_cron_secret
# Select: Production, Preview, Development

vercel env add CRON_WALLET_PRIVATE_KEY
# Paste: 0x_your_private_key
# Select: Production, Preview, Development
\`\`\`

### **Step 5: Redeploy dengan Env Vars**

\`\`\`bash
# Redeploy setelah set env vars
vercel --prod
\`\`\`

---

## ✅ **Checklist Sebelum Deploy**

### **Code:**
- [ ] Semua code sudah di-commit
- [ ] Tidak ada error di local (`npm run build` works)
- [ ] Git repository sudah di-push

### **Environment Variables:**
- [ ] `NEXT_PUBLIC_VAULT_CONTRACT` = V4 address
- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS` = Token address
- [ ] `NEXT_PUBLIC_TOKEN_ADDRESS` = Token address
- [ ] `NEYNAR_API_KEY` = Your key
- [ ] `CRON_SECRET` = Your secret
- [ ] `CRON_WALLET_PRIVATE_KEY` = Your private key

### **Vercel:**
- [ ] Account Vercel sudah dibuat
- [ ] Project sudah di-import atau dibuat
- [ ] Environment variables sudah di-set
- [ ] Ready to deploy

---

## 🧪 **Setelah Deploy - Testing**

### **1. Test Web Browser:**

1. Buka production URL: `https://your-app.vercel.app`
2. ✅ Verify page loads
3. ✅ Connect wallet
4. ✅ Check token balance
5. ✅ Test create reminder (small amount first!)

### **2. Test Farcaster Miniapp:**

1. Buka Warpcast mobile app
2. Share miniapp URL atau buka langsung
3. ✅ Verify miniapp loads
4. ✅ Auto-connect works (if available)
5. ✅ Farcaster username/PFP displays

### **3. Monitor Logs:**

1. Vercel Dashboard → **Deployments**
2. Klik deployment terbaru
3. Klik **"Functions"** tab
4. Check logs untuk errors

---

## ⚠️ **Troubleshooting**

### **Error: Build Failed**

**Cek:**
- Node.js version (harus >= 22.11.0)
- Dependencies install correctly
- Build command works locally

**Fix:**
\`\`\`bash
# Test build locally
npm run build

# Jika error, fix dulu sebelum deploy
\`\`\`

### **Error: Environment Variables Missing**

**Fix:**
- Pastikan semua env vars sudah di-set di Vercel
- Redeploy setelah set env vars

### **Error: Contract Not Found**

**Fix:**
- Verify `NEXT_PUBLIC_VAULT_CONTRACT` = V4 address
- Check contract address di Basescan
- Redeploy setelah update

---

## 📊 **Quick Reference**

### **Deploy Commands:**

\`\`\`bash
# Build check
npm run build

# Commit & push
git add . && git commit -m "Deploy" && git push

# Deploy (CLI)
vercel --prod

# Check deployment
vercel ls

# View logs
vercel logs
\`\`\`

### **Vercel Dashboard:**
- **URL:** https://vercel.com/dashboard
- **Settings:** Project → Settings → Environment Variables
- **Deployments:** Project → Deployments

---

## 🎯 **Recommended Flow**

**Untuk pertama kali:**

1. ✅ **Via Dashboard** (lebih mudah)
   - Import project
   - Set environment variables
   - Deploy

2. ✅ **Untuk update berikutnya:**
   - Push ke Git
   - Auto-deploy (jika connected)
   - Atau: `vercel --prod`

---

## ✅ **Summary**

**Cara Termudah:**
1. Push code ke GitHub
2. Import ke Vercel Dashboard
3. Set environment variables
4. Deploy
5. Test

**Cara Cepat (CLI):**
1. `vercel login`
2. `vercel --prod`
3. Set env vars via CLI
4. Redeploy

---

**Pilih metode yang paling nyaman untuk Anda! 🚀**

**Last Updated:** December 22, 2025
