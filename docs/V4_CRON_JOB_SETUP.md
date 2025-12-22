# ⏰ Cron Job Setup for Auto-Burn

## Question: Apakah Contract Bisa Pakai Cron Job untuk Auto-Burn?

### **Short Answer:**

**✅ YA!** Contract V4 sudah support cron job via `burnMissedReminder()` function.

---

## 🔧 **Contract Support**

### **Function: `burnMissedReminder()`**

**File:** `contracts/ReminderVaultV4.sol` (Line 331-360)

```solidity
function burnMissedReminder(uint256 reminderId) external nonReentrant {
    Reminder storage reminder = reminders[reminderId];
    
    require(!reminder.confirmed, "Reminder was confirmed");
    require(!reminder.burned, "Already burned");
    require(
        block.timestamp > reminder.confirmationDeadline,
        "Deadline not passed yet"
    );

    reminder.burned = true;

    // Burn 30% commitment
    commitToken.transfer(address(0xdead), reminder.commitAmount);

    // Return unclaimed 70% reward pool
    uint256 unclaimedRewards = reminder.rewardPoolAmount - reminder.rewardsClaimed;
    if (unclaimedRewards > 0) {
        commitToken.transfer(reminder.user, unclaimedRewards);
    }

    emit TokensBurned(reminderId, reminder.user, reminder.commitAmount);
}
```

**Key Points:**
- ✅ Public function (anyone can call)
- ✅ No access control needed
- ✅ Safe to call multiple times (has checks)
- ✅ Burns 30% commitment
- ✅ Returns unclaimed 70% to creator

---

## 📋 **Current Cron Job Implementation**

### **File:** `app/api/cron/process-reminders/route.ts`

**Current Status:**
- ✅ Already has cron job setup
- ⚠️ Still using V3 ABI (needs update for V4)
- ✅ Has authentication (CRON_SECRET)
- ✅ Has wallet setup (CRON_WALLET_PRIVATE_KEY)

**What it does:**
1. Check all reminders
2. Find expired ones (past confirmationDeadline)
3. Call `burnMissedReminder()` for each
4. Return results

---

## 🔄 **Update Cron Job for V4**

### **Step 1: Update ABI Import**

**File:** `app/api/cron/process-reminders/route.ts`

```typescript
// ❌ Old (V3)
import { REMINDER_VAULT_V3_ABI } from "@/lib/contracts/config"

// ✅ New (V4)
import { VAULT_ABI } from "@/lib/contracts/config"
```

### **Step 2: Update Contract Instance**

```typescript
// ❌ Old
const vaultContract = new ethers.Contract(
  CONTRACTS.REMINDER_VAULT, 
  REMINDER_VAULT_V3_ABI, 
  wallet
)

// ✅ New
const vaultContract = new ethers.Contract(
  CONTRACTS.REMINDER_VAULT, 
  VAULT_ABI, // V4 ABI
  wallet
)
```

### **Step 3: Update Comment (Optional)**

```typescript
// ❌ Old comment
// Burns 50% commitment tokens to 0xdead
// Returns 50% reward pool to user

// ✅ New comment
// Burns 30% commitment tokens to 0xdead
// Returns unclaimed 70% reward pool to user
```

---

## ⚙️ **Environment Variables**

### **Required:**

```env
# RPC URL
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Cron wallet private key (for signing transactions)
CRON_WALLET_PRIVATE_KEY=0x...

# Cron secret (for authentication)
CRON_SECRET=your_secret_here
```

### **Setup Cron Wallet:**

1. **Create new wallet** (or use existing)
2. **Fund with ETH** for gas fees (~0.01 ETH should last long time)
3. **Export private key** (keep secure!)
4. **Add to Vercel** environment variables

**⚠️ Security:**
- Never commit private key to git
- Use Vercel environment variables
- Rotate periodically

---

## 📅 **Vercel Cron Job Setup**

### **File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Schedule Options:**
- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours

**Recommended:** Every 15-30 minutes untuk catch expired reminders quickly.

---

## 🧪 **Testing Cron Job**

### **Manual Test:**

```bash
# Test locally
curl -X GET http://localhost:3000/api/cron/process-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### **Expected Response:**

```json
{
  "success": true,
  "timestamp": "2025-12-22T10:00:00.000Z",
  "totalChecked": 10,
  "processed": 2,
  "reminders": [
    {
      "id": 5,
      "action": "burned_missed_reminder",
      "user": "0x...",
      "farcasterUsername": "creator",
      "commitmentBurned": "300.0",
      "rewardPoolReturned": "567.0",
      "helpersCount": 3,
      "txHash": "0x...",
      "blockNumber": 12345678
    }
  ]
}
```

---

## 🔍 **How It Works**

### **Flow:**

```
1. Cron job triggered (every 15 min)
   ↓
2. Authenticate with CRON_SECRET
   ↓
3. Connect to Base Mainnet via RPC
   ↓
4. Load wallet with CRON_WALLET_PRIVATE_KEY
   ↓
5. Get contract instance
   ↓
6. Loop through all reminders
   ↓
7. Check if expired (past confirmationDeadline)
   ↓
8. Call burnMissedReminder() for each
   ↓
9. Return results
```

### **Safety Checks:**

```solidity
// In contract
require(!reminder.confirmed, "Reminder was confirmed"); // ✅ Skip if confirmed
require(!reminder.burned, "Already burned");            // ✅ Skip if already burned
require(
    block.timestamp > reminder.confirmationDeadline,    // ✅ Only if expired
    "Deadline not passed yet"
);
```

**Safe to run multiple times!** Contract has checks to prevent double-burning.

---

## 💰 **Gas Costs**

### **Estimated:**

- **Per `burnMissedReminder()` call:** ~100,000 gas
- **Gas price:** ~0.1 gwei (Base Mainnet)
- **Cost per call:** ~$0.01 USD

**Example:**
- 10 expired reminders = 10 calls
- Total cost: ~$0.10 USD
- Very affordable!

---

## 📊 **Monitoring**

### **Check Cron Job Logs:**

**Vercel Dashboard:**
1. Go to your project
2. Click "Functions" tab
3. View `/api/cron/process-reminders` logs

### **Check On-Chain:**

**Basescan:**
1. Search cron wallet address
2. View recent transactions
3. Verify `burnMissedReminder` calls

---

## ⚠️ **Important Notes**

### **1. Cron Wallet Must Have ETH**
- Need ETH for gas fees
- Monitor balance regularly
- Top up if low

### **2. Contract Address Must Be Correct**
- Update `NEXT_PUBLIC_VAULT_CONTRACT` after deploying V4
- Cron job will use this address

### **3. ABI Must Match Contract**
- Use V4 ABI, not V3
- Update import in cron job file

### **4. Rate Limiting**
- Don't run too frequently (every 15 min is good)
- Vercel has rate limits on cron jobs

---

## ✅ **Checklist**

### **Before Deploying:**

- [ ] Update cron job to use V4 ABI
- [ ] Set `CRON_WALLET_PRIVATE_KEY` in Vercel
- [ ] Set `CRON_SECRET` in Vercel
- [ ] Fund cron wallet with ETH
- [ ] Update `NEXT_PUBLIC_VAULT_CONTRACT` to V4 address
- [ ] Test cron job manually
- [ ] Set up `vercel.json` cron schedule
- [ ] Monitor first few runs

---

## 🎯 **Summary**

| Question | Answer |
|----------|--------|
| **Can contract use cron job?** | ✅ Yes, via `burnMissedReminder()` |
| **Is function public?** | ✅ Yes, anyone can call |
| **Is it safe?** | ✅ Yes, has checks to prevent double-burn |
| **Need special permissions?** | ❌ No, public function |
| **Gas cost?** | ~$0.01 per call |
| **Update needed?** | ✅ Yes, update ABI to V4 |

---

**Last Updated**: December 22, 2025  
**Status**: Ready for V4 deployment  
**Contract**: ReminderVaultV4

