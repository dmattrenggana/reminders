# ✅ V4 Contract Deployment Update

**Date:** December 22, 2025  
**Status:** ✅ Deployed & Configured

---

## 📋 **New Contract Address**

**ReminderVaultV4:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f`

**Basescan:**  
🔗 https://basescan.org/address/0x2e3A524912636BF456B3C19f88693087c4dAa25f

**Previous V3 Address (Deprecated):** `0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6`

---

## ✅ **Files Updated**

### **1. Core Configuration**
- ✅ `lib/contracts/config.ts`
  - Updated default ABI to V4 (`REMINDER_VAULT_ABI = REMINDER_VAULT_V4_ABI`)
  - Imported V4 ABI from `v4-abi.ts`

### **2. API Routes**
- ✅ `app/api/cron/process-reminders/route.ts`
  - Changed from `REMINDER_VAULT_V3_ABI` to `REMINDER_VAULT_ABI` (V4)

- ✅ `app/api/reminders/public/route.ts`
  - Changed from `REMINDER_VAULT_V3_ABI` to `REMINDER_VAULT_ABI` (V4)

### **3. Pages**
- ✅ `app/verify/page.tsx`
  - Changed from `REMINDER_VAULT_V3_ABI` to `REMINDER_VAULT_ABI` (V4)

- ✅ `app/config/page.tsx`
  - Changed from `REMINDER_VAULT_V3_ABI` to `REMINDER_VAULT_ABI` (V4)

### **4. Services**
- ✅ `lib/contracts/reminder-service.ts`
  - Changed from `REMINDER_VAULT_V3_ABI` to `REMINDER_VAULT_ABI` (V4)

### **5. Documentation**
- ✅ `CONTRACT_ADDRESSES.md`
  - Updated Vault address to V4
  - Updated environment variable examples
  - Added V4-specific functions (reclaimReminder, getHelpersFor)

---

## 🔧 **Environment Variables**

### **Update Required:**

**Local Development (.env.local):**
\`\`\`env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0x2e3A524912636BF456B3C19f88693087c4dAa25f
\`\`\`

**Vercel Deployment:**
\`\`\`bash
# Update via Vercel Dashboard:
# Project Settings → Environment Variables → Edit NEXT_PUBLIC_VAULT_CONTRACT

# Or via CLI:
vercel env rm NEXT_PUBLIC_VAULT_CONTRACT production
vercel env add NEXT_PUBLIC_VAULT_CONTRACT production
# When prompted, enter: 0x2e3A524912636BF456B3C19f88693087c4dAa25f

# Repeat for preview and development environments
vercel env add NEXT_PUBLIC_VAULT_CONTRACT preview
vercel env add NEXT_PUBLIC_VAULT_CONTRACT development
\`\`\`

---

## 🆕 **V4 Features**

### **New Functions:**
- ✅ `reclaimReminder(uint256 reminderId)` - Reclaim at T-1 hour
- ✅ `getHelpersFor(uint256 reminderId)` - Get list of helpers

### **Updated Functions:**
- ✅ `createReminder()` - Now uses 30/70 split (was 50/50 in V3)
- ✅ `claimReward()` - Fixed tier rewards (10%/6%/3% based on Neynar score)
- ✅ `recordReminder()` - Records helper with Neynar score (0-100)

### **Token Split:**
- ✅ **30%** Commitment (locked until completion or T-1 hour)
- ✅ **70%** Reward Pool (distributed to helpers)

### **Reward Tiers:**
- ✅ **≥ 0.9 Neynar Score:** 10% of reward pool
- ✅ **0.5 - 0.89 Neynar Score:** 6% of reward pool
- ✅ **< 0.5 Neynar Score:** 3% of reward pool

---

## ✅ **Verification Checklist**

- [x] Contract deployed to Base Mainnet
- [x] Contract address verified on Basescan
- [x] Config files updated to use V4 ABI
- [x] All API routes updated to V4 ABI
- [x] All pages updated to V4 ABI
- [x] Services updated to V4 ABI
- [x] Documentation updated
- [ ] **TODO:** Update `.env.local` with new address
- [ ] **TODO:** Update Vercel environment variables
- [ ] **TODO:** Test create reminder flow
- [ ] **TODO:** Test reclaim reminder flow
- [ ] **TODO:** Test helper reward flow

---

## 🚀 **Next Steps**

1. **Update Environment Variables:**
   \`\`\`bash
   # Local
   echo "NEXT_PUBLIC_VAULT_CONTRACT=0x2e3A524912636BF456B3C19f88693087c4dAa25f" >> .env.local
   
   # Vercel (via dashboard or CLI)
   \`\`\`

2. **Restart Dev Server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Test Contract Interaction:**
   - Create a reminder
   - Check token split (30/70)
   - Test reclaim at T-1 hour
   - Test helper reward claim

4. **Verify on Basescan:**
   - Check contract code: https://basescan.org/address/0x2e3A524912636BF456B3C19f88693087c4dAa25f
   - Verify contract functions are callable
   - Check events are emitted correctly

---

## 📊 **Contract Comparison**

| Feature | V3 | V4 |
|---------|----|----|
| **Token Split** | 50/50 | 30/70 ✅ |
| **Reclaim Function** | ❌ | ✅ T-1 hour |
| **Reward Tiers** | Dynamic | Fixed (10%/6%/3%) ✅ |
| **Helper Limit** | Multiple | One per reminder ✅ |
| **Neynar Score** | 0-1.0 | 0-100 (multiplied) ✅ |

---

## ⚠️ **Important Notes**

1. **Breaking Changes:**
   - Token split changed from 50/50 to 30/70
   - Helper can only help once per reminder
   - Reward calculation uses fixed tiers

2. **Migration:**
   - Old V3 reminders remain on V3 contract
   - New reminders use V4 contract
   - No automatic migration needed

3. **Backward Compatibility:**
   - V3 ABI still available in config for reference
   - V4 ABI is now default (`REMINDER_VAULT_ABI`)

---

## 🔗 **Resources**

- **Contract Address:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f`
- **Basescan:** https://basescan.org/address/0x2e3A524912636BF456B3C19f88693087c4dAa25f
- **Token Contract:** `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- **Network:** Base Mainnet (Chain ID: 8453)

---

**Status:** ✅ Ready for Testing  
**Last Updated:** December 22, 2025
