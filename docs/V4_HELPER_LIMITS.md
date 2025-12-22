# 🔒 ReminderVaultV4 - Helper Limits & Rules

## ✅ **1 User = 1 Help Per Reminder**

### **Restriction:**

Setiap user (wallet address) **hanya bisa help remind 1x per reminder**.

### **Code Implementation:**

\`\`\`solidity
// In recordReminder() function
require(
    helperRecords[reminderId][msg.sender].helper == address(0),
    "Already helped this reminder"
);
\`\`\`

**Logic:**
- Check apakah `helperRecords[reminderId][msg.sender]` sudah ada
- Jika `helper == address(0)` → Belum pernah help → ✅ Allowed
- Jika `helper != address(0)` → Sudah pernah help → ❌ Revert

---

## 📊 **What This Means**

### **✅ Allowed:**

1. **User A helps Reminder #1** → ✅ Success
2. **User A helps Reminder #2** → ✅ Success (different reminder)
3. **User A helps Reminder #3** → ✅ Success (different reminder)

### **❌ Not Allowed:**

1. **User A helps Reminder #1** → ✅ Success
2. **User A helps Reminder #1 again** → ❌ Revert: "Already helped this reminder"

---

## 🎯 **Complete Rules**

### **Rule 1: One Help Per Reminder**
- ✅ Each user can help **once per reminder**
- ✅ Can help **multiple different reminders**
- ❌ Cannot help same reminder twice

### **Rule 2: Cannot Help Yourself**
\`\`\`solidity
require(reminder.user != msg.sender, "Cannot remind yourself");
\`\`\`
- ❌ Creator cannot help their own reminder

### **Rule 3: Time Window**
\`\`\`solidity
require(
    block.timestamp >= reminder.reminderTime - 1 hours,
    "Too early to remind"
);
require(
    block.timestamp <= reminder.confirmationDeadline,
    "Reminder expired"
);
\`\`\`
- ✅ Can only help at **T-1 hour** window
- ❌ Too early → Revert
- ❌ Expired → Revert

### **Rule 4: Reminder Must Be Active**
\`\`\`solidity
require(!reminder.confirmed && !reminder.burned, "Reminder already resolved");
\`\`\`
- ❌ Cannot help if reminder already confirmed
- ❌ Cannot help if reminder already burned

---

## 📈 **Example Scenarios**

### **Scenario 1: Multiple Reminders**

\`\`\`
User Alice:
├── Helps Reminder #1 → ✅ Success (70 tokens reward)
├── Helps Reminder #2 → ✅ Success (42 tokens reward)
├── Helps Reminder #3 → ✅ Success (21 tokens reward)
└── Total rewards: 133 tokens
\`\`\`

### **Scenario 2: Same Reminder Twice**

\`\`\`
User Bob:
├── Helps Reminder #1 → ✅ Success (70 tokens reward)
└── Tries to help Reminder #1 again → ❌ Revert: "Already helped this reminder"
\`\`\`

### **Scenario 3: Multiple Users Help Same Reminder**

\`\`\`
Reminder #1 (Reward Pool: 700 tokens):

├── User Alice (Score 0.95) → ✅ 70 tokens (10%)
├── User Bob (Score 0.85) → ✅ 42 tokens (6%)
├── User Charlie (Score 0.70) → ✅ 42 tokens (6%)
├── User Diana (Score 0.40) → ✅ 21 tokens (3%)
└── User Eve (Score 0.25) → ✅ 21 tokens (3%)

Total claimed: 196 tokens
Remaining: 504 tokens (unclaimed)
\`\`\`

---

## 🔍 **Technical Details**

### **Storage Structure:**

\`\`\`solidity
mapping(uint256 => mapping(address => HelperRecord)) public helperRecords;
\`\`\`

**Key:** `reminderId` → `helperAddress`  
**Value:** `HelperRecord` struct

**Check:**
- If `helperRecords[reminderId][address].helper == address(0)` → Not helped yet
- If `helperRecords[reminderId][address].helper != address(0)` → Already helped

### **HelperRecord Struct:**

\`\`\`solidity
struct HelperRecord {
    address helper;
    uint256 neynarScore;
    bool claimed;
    uint256 rewardAmount;
}
\`\`\`

**Once recorded:**
- `helper` = msg.sender (not address(0))
- `neynarScore` = score at time of help
- `claimed` = false (until claimReward called)
- `rewardAmount` = calculated reward based on tier

---

## 💡 **Why This Design?**

### **Benefits:**

1. **Prevent Spam** ✅
   - Users can't spam help same reminder
   - Ensures fair distribution

2. **Prevent Gaming** ✅
   - Can't create multiple accounts to help same reminder
   - One address = one help

3. **Clear Rewards** ✅
   - Each helper gets fixed reward based on their tier
   - No confusion about multiple helps

4. **Gas Efficiency** ✅
   - Only need to check once per user
   - Simple mapping lookup

### **Trade-offs:**

1. **No Multiple Helps** ⚠️
   - User can't help same reminder multiple times
   - Even if they want to increase engagement

2. **Fixed Reward** ⚠️
   - Reward based on first help only
   - Can't improve reward by helping again

---

## 🔄 **Alternative Designs (Not Implemented)**

### **Option A: Multiple Helps Allowed**
\`\`\`solidity
// Allow multiple helps, but reduce reward each time
// Not implemented in V4
\`\`\`

### **Option B: Time-Based Limits**
\`\`\`solidity
// Allow helps with cooldown period
// Not implemented in V4
\`\`\`

### **Option C: Score-Based Limits**
\`\`\`solidity
// Higher score = more helps allowed
// Not implemented in V4
\`\`\`

**Current V4:** Simple one-help-per-reminder rule

---

## 📋 **Summary**

| Question | Answer |
|----------|--------|
| **Can 1 user help multiple reminders?** | ✅ Yes |
| **Can 1 user help same reminder twice?** | ❌ No |
| **Can creator help their own reminder?** | ❌ No |
| **Can user help after deadline?** | ❌ No |
| **Can user help before T-1 hour?** | ❌ No |
| **Can user help if reminder confirmed?** | ❌ No |

---

## 🧪 **Testing**

### **Test Case 1: Same User, Same Reminder**
\`\`\`javascript
// Should fail
await vault.recordReminder(reminderId, 95); // ✅ Success
await vault.recordReminder(reminderId, 95); // ❌ Revert: "Already helped"
\`\`\`

### **Test Case 2: Same User, Different Reminders**
\`\`\`javascript
// Should succeed
await vault.recordReminder(1, 95); // ✅ Success
await vault.recordReminder(2, 95); // ✅ Success
await vault.recordReminder(3, 95); // ✅ Success
\`\`\`

### **Test Case 3: Different Users, Same Reminder**
\`\`\`javascript
// Should succeed
await vault.connect(user1).recordReminder(1, 95); // ✅ Success
await vault.connect(user2).recordReminder(1, 85); // ✅ Success
await vault.connect(user3).recordReminder(1, 70); // ✅ Success
\`\`\`

---

**Last Updated**: December 22, 2025  
**Contract**: ReminderVaultV4  
**Rule**: 1 user = 1 help per reminder
