# 🔄 Contract Address Update - V5

## New Contract Addresses (Base Mainnet)

```bash
# Token Address (CA)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x8984b389cb82e05016db2e4c7230ca0791b9cb07

# Reminder Vault V5 Address
NEXT_PUBLIC_VAULT_CONTRACT=0xd575D4174B34C1af976c54a1c14caf40395Ca0A1
```

---

## ✅ What Changed

### Local Environment (.env.local)
- ✅ Updated token address
- ✅ Updated vault contract address
- ✅ No code changes needed (all addresses use env vars)

### Codebase Updates
- ✅ `lib/contracts/vault-deployer.tsx` - Updated display addresses for deploy page
- ✅ All other files use environment variables (no hardcoded addresses)

---

## 🚀 Deployment Checklist

### 1. Verify Local Setup
```bash
# Check your .env.local file contains:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x8984b389cb82e05016db2e4c7230ca0791b9cb07
NEXT_PUBLIC_VAULT_CONTRACT=0xd575D4174B34C1af976c54a1c14caf40395Ca0A1
```

### 2. Update Vercel Environment Variables
Go to: https://vercel.com/dmattrenggana/reminders/settings/environment-variables

Update these variables:
- `NEXT_PUBLIC_CONTRACT_ADDRESS` → `0x8984b389cb82e05016db2e4c7230ca0791b9cb07`
- `NEXT_PUBLIC_VAULT_CONTRACT` → `0xd575D4174B34C1af976c54a1c14caf40395Ca0A1`

⚠️ **Important:** After updating Vercel env vars, you MUST trigger a new deployment for changes to take effect.

### 3. Verify Deployment
After deployment, check:
- ✅ Contract addresses on `/deploy` page match new addresses
- ✅ Token balance loads correctly
- ✅ Reminder creation works
- ✅ Help to Remind flow works

---

## 🔍 Contract Links

### Token Contract
- **Address:** `0x8984b389cb82e05016db2e4c7230ca0791b9cb07`
- **Basescan:** https://basescan.org/address/0x8984b389cb82e05016db2e4c7230ca0791b9cb07

### Reminder Vault V5
- **Address:** `0xd575D4174B34C1af976c54a1c14caf40395Ca0A1`
- **Basescan:** https://basescan.org/address/0xd575D4174B34C1af976c54a1c14caf40395Ca0A1

---

## 📝 Files Updated

| File | Change | Status |
|------|--------|--------|
| `.env.local` | Updated addresses (manual) | ✅ Done by user |
| `lib/contracts/vault-deployer.tsx` | Updated display constants | ✅ Committed |
| `lib/contracts/config.ts` | No change (uses env vars) | ✅ Already correct |

---

## ⚡ Quick Test Commands

```bash
# 1. Check local env vars
echo %NEXT_PUBLIC_CONTRACT_ADDRESS%
echo %NEXT_PUBLIC_VAULT_CONTRACT%

# 2. Run local dev server
npm run dev

# 3. Visit /deploy page to verify addresses
# http://localhost:3000/deploy
```

---

## 🎯 Next Steps

1. ✅ Commit and push vault-deployer.tsx changes
2. ⏳ Update Vercel environment variables
3. ⏳ Redeploy on Vercel
4. ⏳ Test in production

---

**Updated:** Dec 25, 2024
**Contract Version:** V5
**Network:** Base Mainnet (Chain ID: 8453)

