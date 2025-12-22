# 🔐 Environment Variables Setup

## 📋 **Required Environment Variables**

Copy this configuration to your environment:

### **For Local Development:**

Create `.env.local` in project root:

```env
# Contract Addresses (Base Mainnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6

# RPC URL (Optional - has fallback)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# API Keys (For backend features - optional)
FARCASTER_API_KEY=your_neynar_api_key_here
NEYNAR_API_KEY=your_neynar_api_key_here
CRON_SECRET=your_vercel_cron_secret_here

# App URL
NEXT_PUBLIC_APP_URL=https://remindersbase.vercel.app
```

---

## 🚀 **For Vercel Deployment:**

### **Method 1: Via Dashboard**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07` | Production, Preview, Development |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07` | Production, Preview, Development |
| `NEXT_PUBLIC_VAULT_CONTRACT` | `0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6` | Production, Preview, Development |

### **Method 2: Via CLI**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
# When prompted, paste: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_TOKEN_ADDRESS
# When prompted, paste: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_VAULT_CONTRACT
# When prompted, paste: 0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6
# Select: Production, Preview, Development

# Redeploy to apply changes
vercel --prod
```

---

## ✅ **Verification**

### **Check if variables are loaded:**

```bash
# Local development
npm run dev

# Check console for:
# - No errors about missing contract addresses
# - Contracts initialize successfully
```

### **Test in browser console:**

```javascript
// Should show contract addresses
console.log('Token:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
console.log('Vault:', process.env.NEXT_PUBLIC_VAULT_CONTRACT)

// Or check in your app's config
import { CONTRACTS } from '@/lib/contracts/config'
console.log('Contracts:', CONTRACTS)
```

---

## ⚠️ **Important Notes**

### **1. Why NEXT_PUBLIC_ prefix?**
Variables with `NEXT_PUBLIC_` are exposed to the browser (client-side).
This is safe for contract addresses since they're public blockchain data.

### **2. Token vs Contract vs Vault addresses?**
- `NEXT_PUBLIC_CONTRACT_ADDRESS` = Token contract (legacy naming)
- `NEXT_PUBLIC_TOKEN_ADDRESS` = Token contract (explicit naming)
- `NEXT_PUBLIC_VAULT_CONTRACT` = Vault contract (reminder logic)

Both `CONTRACT_ADDRESS` and `TOKEN_ADDRESS` point to the same token contract for backward compatibility.

### **3. What if I change contracts?**
1. Update the addresses in Vercel dashboard
2. Redeploy: `vercel --prod`
3. Clear browser cache for users

### **4. RPC URL is optional**
The app has fallback public RPCs:
- https://mainnet.base.org
- https://base.llamarpc.com
- https://base-rpc.publicnode.com

You only need `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` if you have a premium RPC provider.

---

## 🐛 **Troubleshooting**

### **Error: "Contract addresses not configured"**

**Cause:** Environment variables not set or typo in variable name

**Solution:**
1. Check spelling: `NEXT_PUBLIC_CONTRACT_ADDRESS` (not `CONTRACT_ADDR`)
2. Check Vercel dashboard if deployed
3. Check `.env.local` if local
4. Restart dev server: `npm run dev`

### **Error: "Contract not responding"**

**Cause:** Wrong contract address or wrong network

**Solution:**
1. Verify addresses on Basescan:
   - Token: https://basescan.org/address/0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
   - Vault: https://basescan.org/address/0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6
2. Make sure you're on Base Mainnet (not Sepolia)
3. Check RPC is working: https://mainnet.base.org

### **Environment variables not updating**

**Cause:** Build cache or browser cache

**Solution:**
```bash
# Clear build cache
rm -rf .next

# Rebuild
npm run build

# On Vercel: Trigger new deployment
vercel --prod --force
```

---

## 📚 **Reference**

- **Contract Details:** See `CONTRACT_ADDRESSES.md`
- **Deployment Guide:** See `DEPLOYMENT_CHECKLIST.md`
- **Refactoring Summary:** See `REFACTORING_SUMMARY.md`

---

**Last Updated:** December 22, 2025  
**Vault Contract:** `0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6`  
**Token Contract:** `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`

