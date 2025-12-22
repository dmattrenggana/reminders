# 📄 Contract Addresses - Base Mainnet

**Network:** Base Mainnet (Chain ID: 8453)  
**Last Updated:** December 22, 2025

---

## 🪙 **Token Contract (ERC20)**

**Contract Name:** CommitToken (CMIT/RMND)  
**Address:** `0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07`

**Basescan:**  
🔗 https://basescan.org/address/0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07

**Functions:**
- `balanceOf(address)` - Check token balance
- `approve(address, uint256)` - Approve spending
- `transfer(address, uint256)` - Transfer tokens
- `symbol()` - Returns token symbol
- `decimals()` - Returns 18

---

## 🔐 **Vault Contract (ReminderVault)**

**Contract Name:** ReminderVaultV4 (V4 - 30/70 Split)  
**Address:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f`

**Basescan:**  
🔗 https://basescan.org/address/0x2e3A524912636BF456B3C19f88693087c4dAa25f

**Previous Version (V3):** `0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6` (deprecated)

**Main Functions:**
- `createReminder(uint256, uint256, string, string)` - Create new reminder (30/70 split)
- `confirmReminder(uint256)` - Confirm reminder completion
- `reclaimReminder(uint256)` - Reclaim at T-1 hour (NEW in V4)
- `burnMissedReminder(uint256)` - Burn tokens for missed reminder
- `recordReminder(uint256, uint256)` - Record helper reminder with Neynar score
- `claimReward(uint256)` - Claim helper rewards (fixed tier: 10%/6%/3%)
- `getUserReminders(address)` - Get user's reminder IDs
- `reminders(uint256)` - Get reminder details
- `getHelpersFor(uint256)` - Get list of helpers for a reminder

---

## 🔧 **Environment Variables**

### **For Local Development (.env.local):**
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0x2e3A524912636BF456B3C19f88693087c4dAa25f
```

### **For Vercel Deployment:**
```bash
# Via Vercel Dashboard:
# Project Settings → Environment Variables → Add:

NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_TOKEN_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0x2e3A524912636BF456B3C19f88693087c4dAa25f

# Or via Vercel CLI:
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
# When prompted, enter: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07

vercel env add NEXT_PUBLIC_TOKEN_ADDRESS
# When prompted, enter: 0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07

vercel env add NEXT_PUBLIC_VAULT_CONTRACT
# When prompted, enter: 0x2e3A524912636BF456B3C19f88693087c4dAa25f
```

---

## 📊 **Contract Interaction Flow**

### **1. Creating a Reminder:**
```
User → Token.approve(vault, amount)
     → Vault.createReminder(amount, time, description, username)
     → Token locked in Vault
```

### **2. Confirming a Reminder:**
```
User → Vault.confirmReminder(reminderId)
     → Tokens returned to user
```

### **3. Missing a Reminder:**
```
Anyone → Vault.burnMissedReminder(reminderId)
        → Tokens burned to 0xdead
```

---

## 🔍 **Verification**

### **Check Token Balance:**
```javascript
const balance = await tokenContract.balanceOf(userAddress)
const symbol = await tokenContract.symbol()
console.log(`Balance: ${balance} ${symbol}`)
```

### **Check Vault:**
```javascript
const reminder = await vaultContract.reminders(reminderId)
console.log('Reminder:', reminder)
```

### **Check User Reminders:**
```javascript
const reminderIds = await vaultContract.getUserReminders(userAddress)
console.log('Your reminders:', reminderIds)
```

---

## ⚠️ **Important Notes**

1. **Token Address vs Vault Address:**
   - Token = Where CMIT/RMND tokens live
   - Vault = Where reminder logic lives
   - Both are on Base Mainnet

2. **Approval Required:**
   - Before creating reminder, user must `approve` vault to spend tokens
   - Our UI handles this automatically

3. **Environment Variables:**
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` = Token address
   - `NEXT_PUBLIC_VAULT_CONTRACT` = Vault address
   - `NEXT_PUBLIC_TOKEN_ADDRESS` = Same as CONTRACT_ADDRESS (backward compatibility)

4. **Network:**
   - Always use Base Mainnet (Chain ID: 8453)
   - Not Base Sepolia testnet!

---

## 📚 **Resources**

- **Base Mainnet Explorer:** https://basescan.org
- **Base RPC:** https://mainnet.base.org
- **Chain ID:** 8453
- **Native Currency:** ETH

---

**Status:** ✅ Production Contracts  
**Network:** Base Mainnet  
**Last Verified:** December 22, 2025

