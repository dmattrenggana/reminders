# 🚀 Deployment Checklist - Farcaster Miniapp

## ✅ **PRE-DEPLOYMENT CHECKLIST**

### **1. Update Node.js Version**
\`\`\`bash
node --version
# Must be: v22.11.0 or higher

# If lower, update:
nvm install 22.11.0
nvm use 22.11.0
\`\`\`

### **2. Install/Update Dependencies**
\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### **3. Verify Environment Variables**
Create/update `.env.local`:
\`\`\`env
# Contract Addresses (Required)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6ee85c2cfab33678de10a5e1634d86abb5eebb07
NEXT_PUBLIC_VAULT_CONTRACT=0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6
NEXT_PUBLIC_TOKEN_ADDRESS=0x6ee85c2cfab33678de10a5e1634d86abb5eebb07

# RPC URL (Optional - has fallback)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# API Keys (For notifications/backend)
FARCASTER_API_KEY=your_neynar_key
CRON_SECRET=your_vercel_cron_secret
\`\`\`

### **4. Test Build Locally**
\`\`\`bash
npm run build

# If successful, test locally:
npm run start
\`\`\`

### **5. Verify Manifest**
Check manifest is accessible:
- Local: `http://localhost:3000/.well-known/farcaster.json`
- Prod: `https://your-domain.com/.well-known/farcaster.json`

Should redirect to: `https://api.farcaster.xyz/miniapps/hosted-manifest/...`

---

## 🌐 **VERCEL DEPLOYMENT**

### **Method 1: Via Vercel Dashboard**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Add environment variables
5. Deploy

### **Method 2: Via CLI**
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
vercel env add NEXT_PUBLIC_VAULT_CONTRACT
vercel env add NEXT_PUBLIC_TOKEN_ADDRESS
\`\`\`

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **Test 1: Web Browser Access**
1. Open: `https://your-domain.vercel.app`
2. Should load dashboard
3. Click "Connect Wallet"
4. Should show MetaMask/injected wallet option
5. ✅ Success if connects

### **Test 2: Farcaster Miniapp Access**
1. Open Warpcast mobile app
2. Go to your miniapp URL
3. Or share cast with miniapp link
4. Should show splash screen (1-2 seconds)
5. Should load dashboard
6. Click "Connect Wallet"
7. Should auto-detect Farcaster wallet
8. ✅ Success if connects without errors

### **Test 3: Console Checks**
Open DevTools console:

**In Web Browser:**
\`\`\`javascript
console.log('Environment:', window.Farcaster ? 'Miniapp' : 'Web')
// Should show: "Environment: Web"

console.log('Connectors:', connectors.map(c => c.id))
// Should show: ["injected"]
\`\`\`

**In Farcaster Miniapp:**
\`\`\`javascript
console.log('Environment:', window.Farcaster ? 'Miniapp' : 'Web')
// Should show: "Environment: Miniapp"

console.log('Connectors:', connectors.map(c => c.id))
// Should show: ["farcasterMiniApp", "injected"] or ["io.farcaster.miniapp", "injected"]
\`\`\`

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Infinite Splash Screen**
**Cause:** `sdk.actions.ready()` not called
**Solution:** Already implemented in `components/providers/farcaster-provider.tsx`
**Verify:**
\`\`\`typescript
// Should see this in code:
await sdk.actions.ready({});
\`\`\`

### **Issue: "Cannot connect wallet"**
**Cause 1:** Wrong connector ID
**Solution:** Updated to use `farcasterMiniApp` or `io.farcaster.miniapp`

**Cause 2:** SDK not loaded
**Check:** Console for errors about `@farcaster/miniapp-sdk`

### **Issue: "Module not found" errors**
**Cause:** Dependencies not installed
**Solution:**
\`\`\`bash
rm -rf node_modules
rm package-lock.json
npm install
\`\`\`

### **Issue: Build fails on Vercel**
**Cause:** Node.js version mismatch
**Solution:** Vercel should auto-detect from `package.json`:
\`\`\`json
"engines": {
  "node": ">=22.11.0"
}
\`\`\`

### **Issue: CSP errors in console**
**Cause:** Restrictive Content Security Policy
**Solution:** Already configured in `vercel.json`
**Verify:**
\`\`\`json
"frame-ancestors 'self' https://*.warpcast.com https://*.farcaster.xyz"
\`\`\`

---

## 📱 **MINIAPP SUBMISSION** (Optional)

If you want to list in Farcaster's miniapp directory:

### **1. Register on Warpcast**
- Go to: https://warpcast.com/~/developers/miniapps
- Register your domain
- Get `accountAssociation` signature

### **2. Update Manifest**
Update `app/manifest.json` with accountAssociation:
\`\`\`json
{
  "frame": {
    "name": "Reminders",
    "homeUrl": "https://your-domain.vercel.app/",
    ...
  },
  "accountAssociation": {
    "header": "eyJ...",
    "payload": "eyJ...",
    "signature": "..."
  }
}
\`\`\`

### **3. Submit for Review**
- Test thoroughly
- Submit via Warpcast developer portal
- Wait for approval (usually 1-3 days)

---

## 📊 **MONITORING**

### **Check Application Health:**
1. **Vercel Dashboard:** Monitor build logs and runtime logs
2. **Error Tracking:** Check Vercel Analytics for errors
3. **User Testing:** Have beta users test both modes

### **Key Metrics to Monitor:**
- ✅ Connection success rate (web vs miniapp)
- ✅ Transaction success rate
- ✅ Page load time
- ❌ SDK initialization errors
- ❌ Connector detection failures

---

## 🔄 **ROLLBACK PLAN**

If issues occur after deployment:

### **Quick Rollback:**
\`\`\`bash
# Via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"

# Via CLI:
vercel rollback
\`\`\`

### **Emergency Fixes:**
\`\`\`bash
# Make fix locally
git add .
git commit -m "fix: emergency fix"
git push

# Vercel auto-deploys from main branch
# Or manual deploy:
vercel --prod
\`\`\`

---

## ✅ **SUCCESS CRITERIA**

Your deployment is successful when:

- [ ] Build completes without errors
- [ ] Web browser access works
- [ ] Miniapp access works in Warpcast
- [ ] Wallet connection works in both modes
- [ ] No console errors related to SDK
- [ ] Transactions can be signed
- [ ] Reminders can be created
- [ ] No infinite splash screen

---

## 📞 **SUPPORT RESOURCES**

- **Farcaster Docs:** https://miniapps.farcaster.xyz/docs
- **Base Docs:** https://docs.base.org
- **Vercel Docs:** https://vercel.com/docs
- **Wagmi Docs:** https://wagmi.sh

---

**Last Updated:** December 22, 2025  
**Status:** ✅ Ready for production deployment
