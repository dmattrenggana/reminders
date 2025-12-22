# Deploy ReminderVaultV4 Contract

## 🎯 What's New in V4

V4 contract implements the **exact workflow** we discussed:

### **Key Features:**

1. **30/70 Token Split** ✅
   - 30% commitment (returned on confirm, burned if missed)
   - 70% reward pool (distributed to helpers)

2. **Fixed Tier Rewards** ✅
   - **≥ 0.9 Neynar score**: 10% of reward pool
   - **0.5 - 0.89**: 6% of reward pool
   - **< 0.5**: 3% of reward pool

3. **Reclaim Mechanism** ✅
   - Creator can reclaim at **T-1 hour** (1 hour before deadline)
   - Returns: 30% commitment + unclaimed portion of 70% reward pool

4. **Burn Mechanism** ✅
   - If deadline passed: Burn 30% commitment
   - Return unclaimed 70% reward pool to creator

5. **Helper System** ✅
   - Helpers can only help at **T-1 hour** window
   - Record with Neynar score (0-100 scale)
   - Claim reward after confirmation or deadline passed

---

## 📋 Deployment Steps

### **Step 1: Prepare Contract**

1. Copy code from `contracts/ReminderVaultV4.sol`
2. Or use flattened version (if needed for verification)

### **Step 2: Deploy via Remix**

1. Go to https://remix.ethereum.org
2. Create new file: `ReminderVaultV4.sol`
3. Paste contract code
4. **Compile Settings:**
   - Compiler: `0.8.20`
   - Optimization: Enabled (200 runs)
   - EVM Version: `default`
5. **Deploy:**
   - Environment: `Injected Provider - MetaMask`
   - Network: **Base Mainnet** (Chain ID: 8453)
   - Contract: `ReminderVaultV4`
   - Constructor argument: `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07` (Token address)
6. **Confirm transaction** in MetaMask
7. **Copy deployed contract address**

### **Step 3: Verify on Basescan**

1. Go to: https://basescan.org/address/YOUR_NEW_CONTRACT_ADDRESS#code
2. Click "Verify and Publish"
3. **Verification Settings:**
   - Compiler: `0.8.20`
   - Optimization: `Yes` (200 runs)
   - License: `MIT`
4. **Paste flattened code** (if using flattened version)
   - Or paste original code with imports
5. Click "Verify and Publish"
6. Wait for verification

### **Step 4: Update Environment Variables**

**Local (.env.local):**
```env
NEXT_PUBLIC_VAULT_CONTRACT=YOUR_NEW_V4_CONTRACT_ADDRESS
```

**Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_VAULT_CONTRACT` with new address
3. Redeploy: `vercel --prod`

---

## 🔧 Contract Functions

### **For Creators:**

```solidity
// Create reminder with 30/70 split
function createReminder(
    uint256 totalAmount,
    uint256 reminderTime,
    string memory description,
    string memory farcasterUsername
) returns (uint256)

// Confirm completion (returns 30% commitment)
function confirmReminder(uint256 reminderId)

// Reclaim at T-1 hour (returns 30% + unclaimed 70%)
function reclaimReminder(uint256 reminderId)
```

### **For Helpers:**

```solidity
// Record reminder with Neynar score (only at T-1 hour)
function recordReminder(uint256 reminderId, uint256 neynarScore)

// Claim reward (after confirmation or deadline)
function claimReward(uint256 reminderId)
```

### **For Cron Jobs:**

```solidity
// Burn missed reminder (after deadline)
function burnMissedReminder(uint256 reminderId)
```

### **View Functions:**

```solidity
// Get helpers for reminder
function getHelpersFor(uint256 reminderId) view returns (address[])

// Get user's reminders
function getUserReminders(address user) view returns (uint256[])

// Check if can help
function canRemind(uint256 reminderId) view returns (bool)

// Get active reminders
function getActiveReminders() view returns (uint256[])
```

---

## 📊 Example Flow

### **1. Create Reminder:**
```
User locks 1000 tokens
→ 300 tokens (30%) → commitment
→ 700 tokens (70%) → reward pool
```

### **2. Helper Helps (T-1 hour):**
```
Helper with Neynar score 0.95 (95/100)
→ Tier: HIGH (10%)
→ Reward: 70 tokens (10% of 700)
```

### **3. Creator Confirms:**
```
→ Gets back 300 tokens (30% commitment)
→ Helpers can claim their rewards
```

### **4. Creator Reclaims (Alternative):**
```
At T-1 hour, creator reclaims:
→ Gets 300 tokens (30% commitment)
→ Gets unclaimed portion of 700 tokens (70% reward pool)
```

### **5. Missed Deadline (Cron Job):**
```
After deadline:
→ Burns 300 tokens (30% commitment) → 0xdead
→ Returns unclaimed 70% to creator
```

---

## ⚠️ Important Notes

### **1. Neynar Score Format**
- Contract expects **0-100 scale** (representing 0.0-1.0)
- Frontend should multiply by 100 before calling
- Example: Score 0.95 → Pass 95 to contract

### **2. T-1 Hour Window**
- Helpers can only help **exactly 1 hour before deadline**
- Window: `[reminderTime - 1 hour, reminderTime + 1 hour]`
- Button should be disabled outside this window

### **3. Reclaim Timing**
- Can only reclaim at **T-1 hour** (not before, not after)
- After deadline, use `burnMissedReminder` instead

### **4. Reward Calculation**
- Rewards are **fixed percentages**, not proportional
- Multiple helpers can get same tier rewards
- Total rewards can exceed 70% if many helpers (by design)

---

## 🧪 Testing Checklist

### **Before Deployment:**
- [ ] Compile without errors
- [ ] Check constructor parameter (token address)
- [ ] Verify all functions compile

### **After Deployment:**
- [ ] Verify contract on Basescan
- [ ] Test `createReminder` with small amount
- [ ] Test `recordReminder` at T-1 hour
- [ ] Test `claimReward` after confirmation
- [ ] Test `reclaimReminder` at T-1 hour
- [ ] Test `burnMissedReminder` after deadline

### **Integration:**
- [ ] Update `.env.local` with new address
- [ ] Update Vercel env vars
- [ ] Update `lib/contracts/config.ts` ABI
- [ ] Test in app: Create reminder
- [ ] Test in app: Help remind
- [ ] Test in app: Claim reward

---

## 🔄 Migration from V3

If migrating from V3:

1. **Deploy V4** to new address
2. **Update env vars** (keep V3 for old reminders)
3. **New reminders** use V4
4. **Old reminders** still work on V3

Or:

1. **Deploy V4** to same address (if upgrading)
2. **All reminders** migrate to V4 logic
3. **Test thoroughly** before going live

---

## 📚 Contract Addresses

**Token Contract (unchanged):**
```
0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
```

**Vault Contract (V4 - new):**
```
[YOUR_NEW_V4_ADDRESS]
```

---

## 🐛 Troubleshooting

### **"Amount must be greater than 0"**
- Check totalAmount > 0
- Check token balance sufficient

### **"Too early to remind"**
- Must be at T-1 hour (1 hour before deadline)
- Check `reminderTime - 1 hours <= now <= reminderTime + 1 hour`

### **"Already helped this reminder"**
- Each helper can only help once per reminder
- Check `helperRecords[reminderId][address]`

### **"Insufficient reward pool"**
- Total rewards claimed exceed 70% pool
- This can happen if many helpers (by design)

---

**Status**: ✅ Ready for deployment  
**Network**: Base Mainnet  
**Compiler**: Solidity 0.8.20  
**Last Updated**: December 22, 2025

