# 🚀 Complete V4 Deployment Guide

## Overview

Deploy **ReminderVaultV4** contract yang sesuai dengan workflow:
- ✅ 30/70 token split
- ✅ Fixed tier rewards (10%, 6%, 3%)
- ✅ Reclaim mechanism at T-1 hour
- ✅ Proper burn mechanism

---

## 📋 Pre-Deployment Checklist

- [ ] Have Base Mainnet ETH for gas (~0.01 ETH should be enough)
- [ ] Token contract address: `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`
- [ ] MetaMask connected to Base Mainnet
- [ ] Contract code ready (`contracts/ReminderVaultV4.sol`)

---

## 🔧 Step-by-Step Deployment

### **Step 1: Open Remix IDE**

1. Go to: https://remix.ethereum.org
2. Create new workspace (optional) or use default

### **Step 2: Create Contract File**

1. In `contracts/` folder, create new file: `ReminderVaultV4.sol`
2. Copy entire code from `contracts/ReminderVaultV4.sol` in your project
3. Paste into Remix

### **Step 3: Install Dependencies (if needed)**

Remix should auto-detect OpenZeppelin imports. If not:

1. Go to "File Explorer"
2. Create folder: `node_modules/@openzeppelin/contracts/`
3. Copy OpenZeppelin contracts (or use Remix's import resolver)

**Or use flattened version** (see below)

### **Step 4: Compile Contract**

1. Go to "Solidity Compiler" tab
2. **Settings:**
   - Compiler: `0.8.20`
   - Language: `Solidity`
   - EVM Version: `default`
   - Enable Optimization: ✅ **Yes**
   - Runs: `200`
3. Click **"Compile ReminderVaultV4.sol"**
4. Check for errors (should be none)

### **Step 5: Deploy Contract**

1. Go to "Deploy & Run Transactions" tab
2. **Environment:** `Injected Provider - MetaMask`
3. **Account:** Select your wallet (should show Base Mainnet)
4. **Contract:** Select `ReminderVaultV4`
5. **Constructor Arguments:**
   ```
   0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
   ```
   (Token contract address)
6. Click **"Deploy"**
7. **Approve transaction** in MetaMask
8. Wait for confirmation
9. **Copy deployed contract address** from Remix

### **Step 6: Verify on Basescan**

1. Go to: https://basescan.org/address/YOUR_CONTRACT_ADDRESS#code
2. Click **"Contract"** tab → **"Verify and Publish"**
3. **Verification Settings:**
   - Compiler: `0.8.20`
   - Optimization: `Yes` (200 runs)
   - License: `MIT`
   - Solidity Source Code: `Single file` or `Standard JSON Input`
4. **Paste contract code:**
   - If using flattened: Paste flattened version
   - If using original: Paste with imports (Remix can handle)
5. Click **"Verify and Publish"**
6. Wait for verification (usually 30 seconds)

---

## 🔄 Update Application

### **1. Update Environment Variables**

**Local (.env.local):**
```env
NEXT_PUBLIC_VAULT_CONTRACT=YOUR_NEW_V4_ADDRESS
```

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_VAULT_CONTRACT`
3. Redeploy: `vercel --prod`

### **2. Update ABI in Code**

**File: `lib/contracts/config.ts`**

```typescript
import { REMINDER_VAULT_V4_ABI } from "./v4-abi";

// Use V4 ABI
export const VAULT_ABI = REMINDER_VAULT_V4_ABI;
export const REMINDER_VAULT_ABI = REMINDER_VAULT_V4_ABI;
```

### **3. Update Function Calls**

**File: `hooks/use-reminder-operations.ts`**

Already using `createReminder` - no changes needed!

**File: `hooks/use-claim-callback.ts`**

Already using `recordReminder` and `claimReward` - no changes needed!

**But update Neynar score format:**
```typescript
// V4 expects 0-100 scale (not 0-1)
args: [
  BigInt(pendingClaimData.reminderId), 
  Math.floor(pendingClaimData.neynarScore * 100) // Multiply by 100!
],
```

---

## 🧪 Testing After Deployment

### **1. Test Create Reminder**

```javascript
// In browser console or Remix
const vault = new ethers.Contract(
  "YOUR_V4_ADDRESS",
  ABI,
  signer
);

const tx = await vault.createReminder(
  ethers.utils.parseEther("1000"), // 1000 tokens
  Math.floor(Date.now() / 1000) + 86400, // Tomorrow
  "Test reminder",
  "testuser"
);
await tx.wait();
console.log("Reminder created!");
```

### **2. Test Record Reminder**

Wait until T-1 hour, then:

```javascript
const tx = await vault.recordReminder(
  reminderId,
  95 // Neynar score (0-100 scale)
);
await tx.wait();
```

### **3. Test Claim Reward**

After confirmation or deadline:

```javascript
const tx = await vault.claimReward(reminderId);
await tx.wait();
```

### **4. Test Reclaim**

At T-1 hour:

```javascript
const tx = await vault.reclaimReminder(reminderId);
await tx.wait();
```

---

## 📊 Contract Comparison

| Feature | V3 | V4 |
|---------|----|----|
| Token Split | 50/50 | **30/70** ✅ |
| Reward System | Proportional | **Fixed Tiers** ✅ |
| Reclaim | No | **Yes (T-1 hour)** ✅ |
| Burn Mechanism | 50% burn | **30% burn** ✅ |
| Helper Window | T-1 to deadline | **T-1 to deadline** ✅ |

---

## ⚠️ Important Notes

### **1. Neynar Score Format**

**V4 expects 0-100 scale:**
- Frontend score: `0.95` (0-1 range)
- Contract expects: `95` (0-100 range)
- **Multiply by 100** before calling!

### **2. Reclaim Timing**

- Can only reclaim at **exactly T-1 hour**
- Window: `[reminderTime - 1 hour, reminderTime)`
- After deadline, use `burnMissedReminder`

### **3. Reward Tiers**

Fixed percentages (not proportional):
- Multiple helpers can get same tier
- Total rewards can exceed 70% if many helpers
- This is by design!

### **4. Gas Costs**

Estimated gas per function:
- `createReminder`: ~150,000 gas
- `recordReminder`: ~100,000 gas
- `claimReward`: ~80,000 gas
- `confirmReminder`: ~80,000 gas
- `reclaimReminder`: ~100,000 gas
- `burnMissedReminder`: ~100,000 gas

---

## 🐛 Troubleshooting

### **"Compiler version mismatch"**
- Use Solidity 0.8.20 exactly
- Check Remix compiler version

### **"Insufficient funds"**
- Need ETH for gas fees
- Check MetaMask balance

### **"Contract verification failed"**
- Check compiler settings match
- Use flattened version if imports fail
- Verify constructor arguments

### **"Function not found"**
- Check ABI matches contract
- Verify contract address correct
- Check network (Base Mainnet)

---

## 📚 Resources

- **Basescan**: https://basescan.org
- **Remix IDE**: https://remix.ethereum.org
- **Base Docs**: https://docs.base.org
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts

---

## ✅ Post-Deployment Checklist

- [ ] Contract deployed successfully
- [ ] Contract verified on Basescan
- [ ] Environment variables updated
- [ ] ABI updated in code
- [ ] Neynar score format fixed (multiply by 100)
- [ ] Test create reminder
- [ ] Test help remind
- [ ] Test claim reward
- [ ] Test reclaim mechanism
- [ ] App working correctly

---

**Ready to deploy!** 🚀

**Last Updated**: December 22, 2025  
**Contract Version**: V4  
**Network**: Base Mainnet

