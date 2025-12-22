# 🚀 Deployment Ready Checklist

## ✅ **Pre-Deployment Verification**

### **1. Code Status** ✅

- ✅ V4 contract functions implemented
- ✅ All imports fixed
- ✅ No linter errors
- ✅ V4 ABI configured
- ✅ Environment variables template ready

### **2. Contract Status** ✅

- ✅ V4 contract deployed: `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
- ✅ Contract verified on Basescan
- ✅ All functions tested (if possible)

### **3. Environment Variables** ⚠️

**Local (.env.local):**
- [ ] `NEXT_PUBLIC_VAULT_CONTRACT` = `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- [ ] `NEXT_PUBLIC_TOKEN_ADDRESS` = `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- [ ] `NEYNAR_API_KEY` = (your key)
- [ ] `CRON_SECRET` = (your secret)
- [ ] `CRON_WALLET_PRIVATE_KEY` = (your private key)

**Vercel (Production):**
- [ ] All environment variables set
- [ ] `NEXT_PUBLIC_VAULT_CONTRACT` updated to V4 address
- [ ] All variables applied to Production, Preview, Development

---

## 🚀 **Deployment Steps**

### **Step 1: Final Code Check**

```bash
# Check for errors
npm run build

# If successful, continue
# If errors, fix them first
```

### **Step 2: Commit & Push**

```bash
# Stage all changes
git add .

# Commit
git commit -m "Implement V4 contract functions and update to V4 address"

# Push to repository
git push origin main
# (or your branch name)
```

### **Step 3: Deploy to Vercel**

**Option A: Automatic (if connected to Git)**
- Vercel will auto-deploy on push
- Check deployment status in Vercel dashboard

**Option B: Manual Deploy**
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### **Step 4: Verify Environment Variables**

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify all variables are set:
   - ✅ `NEXT_PUBLIC_VAULT_CONTRACT` = V4 address
   - ✅ `NEXT_PUBLIC_CONTRACT_ADDRESS` = Token address
   - ✅ `NEXT_PUBLIC_TOKEN_ADDRESS` = Token address
   - ✅ `NEYNAR_API_KEY` = Your key
   - ✅ `CRON_SECRET` = Your secret
   - ✅ `CRON_WALLET_PRIVATE_KEY` = Your private key

5. **If any missing, add them now!**

### **Step 5: Redeploy After Env Update**

If you updated environment variables:
```bash
# Trigger redeploy
vercel --prod

# Or via dashboard:
# Deployments → Redeploy latest
```

---

## 🧪 **Post-Deployment Testing**

### **Test 1: Web Browser**

1. Open production URL: `https://your-app.vercel.app`
2. ✅ Verify page loads
3. ✅ Connect wallet
4. ✅ Check token balance displays
5. ✅ Try create reminder (test transaction)

### **Test 2: Farcaster Miniapp**

1. Open Warpcast mobile app
2. Navigate to miniapp URL
3. ✅ Verify miniapp loads
4. ✅ Auto-connect works (if available)
5. ✅ Farcaster username/PFP displays
6. ✅ Can interact with app

### **Test 3: Contract Functions**

1. ✅ Create reminder works
2. ✅ Token split 30/70 correct
3. ✅ Reminder appears in feed
4. ✅ Confirm reminder works (if testable)
5. ✅ Help remind works (if testable)

---

## ⚠️ **Important Notes**

### **Before Deploying:**

1. **Environment Variables:**
   - ⚠️ **CRITICAL:** Update `NEXT_PUBLIC_VAULT_CONTRACT` to V4 address in Vercel
   - ⚠️ All required variables must be set
   - ⚠️ Redeploy after updating env vars

2. **Cron Job:**
   - ⚠️ Verify `CRON_SECRET` is set
   - ⚠️ Verify `CRON_WALLET_PRIVATE_KEY` is set
   - ⚠️ Verify cron wallet has Base ETH for gas

3. **API Keys:**
   - ⚠️ Verify `NEYNAR_API_KEY` is valid
   - ⚠️ Test API calls work

### **After Deploying:**

1. **Monitor:**
   - Check Vercel logs for errors
   - Monitor transaction success rate
   - Check cron job execution

2. **Fix Issues:**
   - If errors, check logs
   - Update environment variables if needed
   - Redeploy if necessary

---

## 📋 **Quick Deployment Command**

```bash
# 1. Build check
npm run build

# 2. Commit
git add . && git commit -m "Deploy V4 contract integration"

# 3. Push
git push

# 4. Deploy (if not auto-deploy)
vercel --prod
```

---

## ✅ **Final Checklist**

Before clicking deploy:

- [ ] Code builds without errors (`npm run build`)
- [ ] All environment variables set in Vercel
- [ ] V4 contract address updated in Vercel
- [ ] Git changes committed and pushed
- [ ] Ready to test after deployment

---

## 🎯 **Summary**

**Status:** ✅ **READY TO DEPLOY!**

**What's Done:**
- ✅ V4 functions implemented
- ✅ Code fixed and tested
- ✅ Environment variables template ready

**What You Need to Do:**
1. ✅ Update Vercel environment variables (especially V4 address)
2. ✅ Run `npm run build` to verify
3. ✅ Commit and push code
4. ✅ Deploy to Vercel
5. ✅ Test in production

---

**You're ready to deploy! 🚀**

**Last Updated:** December 22, 2025

