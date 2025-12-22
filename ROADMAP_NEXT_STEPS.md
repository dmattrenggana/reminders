# 🗺️ Roadmap - Next Steps

## ⚠️ **Current Issues**

1. **Import Errors** - `dashboard-client.tsx` imports deleted files
2. **Contract Not Deployed** - V4 contract belum di-deploy
3. **Old Functions** - `useVault` masih pakai `lockTokens` (old)
4. **Missing Hooks** - `use-claim-callback` dan `use-reminder-operations` dihapus

---

## 🎯 **Priority Actions**

### **PHASE 1: Fix Critical Errors (URGENT)**

#### **Step 1.1: Fix Import Errors**

**File:** `components/dashboard-client.tsx`

**Fix imports:**
```typescript
// ❌ Remove these (deleted files)
// import { useClaimCallback } from "@/hooks/use-claim-callback";
// import { useReminderOperations } from "@/hooks/use-reminder-operations";
// import { ReminderCard } from "@/components/reminder-card";

// ✅ Use existing
import { ReminderCard } from "@/components/reminders/reminder-card";
```

#### **Step 1.2: Replace Deleted Hooks**

**Option A:** Use `useVault` and `useReminders` directly  
**Option B:** Create minimal inline functions  
**Option C:** Use `useReminderService` (already exists)

---

### **PHASE 2: Deploy Contract V4**

#### **Step 2.1: Deploy via Remix**

1. Open: https://remix.ethereum.org
2. Create: `ReminderVaultV4.sol`
3. Copy code from `contracts/ReminderVaultV4.sol`
4. Compile: Solidity 0.8.20
5. Deploy: Base Mainnet
6. Constructor: `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
7. Copy address

#### **Step 2.2: Verify on Basescan**

1. Go to Basescan → Your contract
2. Verify and Publish
3. Compiler: 0.8.20, Optimization: Yes
4. Paste code

#### **Step 2.3: Update Environment**

```env
# .env.local
NEXT_PUBLIC_VAULT_CONTRACT=YOUR_NEW_V4_ADDRESS

# Vercel
# Update in dashboard
```

---

### **PHASE 3: Update Code for V4**

#### **Step 3.1: Update useVault**

Change `lockTokens` → `createReminder` (4 params)

#### **Step 3.2: Update useReminders**

Change `nextId` → `nextReminderId`  
Update reminder struct fields

#### **Step 3.3: Test All Functions**

- [ ] Create reminder
- [ ] Help remind
- [ ] Claim reward
- [ ] Confirm reminder
- [ ] Reclaim reminder

---

### **PHASE 4: Setup Cron Job**

#### **Step 4.1: Environment Variables**

```env
CRON_WALLET_PRIVATE_KEY=0x...
CRON_SECRET=your_secret
```

#### **Step 4.2: Fund Cron Wallet**

Send ~0.01 ETH for gas fees

#### **Step 4.3: Setup Vercel Cron**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-reminders",
    "schedule": "*/15 * * * *"
  }]
}
```

---

## 📋 **Quick Fix Checklist**

### **Immediate (Fix Errors):**
- [ ] Fix `dashboard-client.tsx` imports
- [ ] Remove deleted hook dependencies
- [ ] Use existing components/hooks
- [ ] Test app runs without errors

### **Short Term (Deploy V4):**
- [ ] Deploy V4 contract
- [ ] Verify on Basescan
- [ ] Update env vars
- [ ] Update `useVault` for V4
- [ ] Update `useReminders` for V4

### **Medium Term (Integration):**
- [ ] Test create reminder
- [ ] Test help remind flow
- [ ] Test claim reward
- [ ] Test reclaim
- [ ] Setup cron job

### **Long Term (Production):**
- [ ] Deploy to Vercel
- [ ] Monitor cron job
- [ ] Fix any issues
- [ ] Optimize performance

---

## 🔧 **Recommended Approach**

### **Quick Fix (Minimal Changes):**

1. **Fix imports** - Use existing components
2. **Inline functions** - Replace deleted hooks with inline code
3. **Test basic flow** - Make sure app runs
4. **Deploy V4** - Then update for V4

### **Or Full Refactor:**

1. **Recreate hooks** - Build proper hooks for V4
2. **Update all code** - Full V4 integration
3. **Deploy V4** - Then test everything

---

## ⚡ **Fastest Path Forward**

### **Option 1: Minimal Fix (Recommended)**

1. Fix import errors (5 min)
2. Deploy V4 contract (15 min)
3. Update env vars (2 min)
4. Test (10 min)

**Total: ~30 minutes**

### **Option 2: Full Integration**

1. Fix all errors
2. Update all hooks for V4
3. Deploy V4
4. Full testing

**Total: ~2-3 hours**

---

## 🎯 **My Recommendation**

**Start with Option 1:**
1. Fix import errors first (app must run)
2. Deploy V4 contract (core functionality)
3. Update env vars
4. Test basic flow
5. Then iterate and improve

---

**Status**: ⚠️ Needs immediate action  
**Priority**: Fix errors → Deploy V4 → Test  
**Estimated Time**: 30 min - 3 hours (depending on approach)

