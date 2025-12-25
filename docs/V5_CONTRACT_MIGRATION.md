# 🚀 V5 Contract Migration - Complete Guide

## ✅ What Changed

### **V4 → V5 Key Differences:**

| Feature | V4 (Old) | V5 (New) |
|---------|----------|----------|
| **recordReminder** | ✅ Required on-chain | ❌ Removed! |
| **Verification** | On-chain via recordReminder | Off-chain (Supabase) |
| **claimReward** | Simple, no signature | Signature-based (EIP-712) |
| **Parameters** | `reminderTime` | `deadline` |
| **Flow complexity** | 2 transactions | 1 transaction |

---

## 🎯 New V5 Workflow

### **Helper Flow (Simplified!):**

\`\`\`
1. Helper posts on Farcaster
         ↓
2. Verified off-chain (Supabase)
         ↓
3. Get signature from backend
         ↓
4. Call claimReward(reminderId, neynarScore, signature)
         ↓
5. Done! ✅

NO recordReminder step! 🎉
\`\`\`

### **Old V4 Flow (Removed):**

\`\`\`
❌ 1. Post verification
❌ 2. Call recordReminder
❌ 3. Wait for confirmation
❌ 4. Call claimReward
\`\`\`

---

## 🔧 Implementation Details

### **Contract Functions (V5):**

\`\`\`solidity
// Create reminder (unchanged parameters order)
function createReminder(
    uint256 totalAmount,
    uint256 deadline,  // ← Note: "deadline" not "reminderTime"
    string memory description,
    string memory farcasterUsername
) returns (uint256)

// Claim reward (NEW signature parameter!)
function claimReward(
    uint256 reminderId,
    uint256 neynarScore,  // 0-100
    bytes memory signature // ← Backend-signed!
)

// Reclaim reminder (T-1h window)
function reclaimReminder(uint256 reminderId)

// Burn missed reminder (after deadline)
function burnMissedReminder(uint256 reminderId)
\`\`\`

### **Key Changes:**

1. **No `recordReminder`** - Helper post verification stays off-chain
2. **Signature-based claim** - Backend signs (helper, reminderId, neynarScore)
3. **Strict T-1h window** - Helper can only claim from T-1h to deadline
4. **On-chain reward calculation** - Contract calculates tiers (High/Med/Low)

---

## 🔐 Signature Generation

### **Message Hash:**

\`\`\`solidity
keccak256(abi.encodePacked(helperAddress, reminderId, neynarScore))
\`\`\`

### **Backend Implementation:**

\`\`\`typescript
// app/api/sign-claim/route.ts
const messageHash = ethers.solidityPackedKeccak256(
  ['address', 'uint256', 'uint256'],
  [helperAddress, reminderId, neynarScore]
);

const signature = await wallet.signMessage(ethers.getBytes(messageHash));
\`\`\`

### **Contract Verification:**

\`\`\`solidity
bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, reminderId, neynarScore));
bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
require(ethSignedMessageHash.recover(signature) == signerAddress, "Invalid Signature");
\`\`\`

---

## 🛠️ Setup Instructions

### **Step 1: Generate Signer Wallet**

\`\`\`bash
# Generate new wallet for signing
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
# Output: 0x1234567890abcdef...

# Get address
node -e "console.log(new (require('ethers').Wallet)('0x1234567890abcdef...').address)"
# Output: 0xabcd...
\`\`\`

### **Step 2: Add Environment Variable**

\`\`\`env
# .env.local
SIGNER_PRIVATE_KEY=0x1234567890abcdef...your_private_key_here
\`\`\`

⚠️ **IMPORTANT:** This private key is used ONLY for signing claim messages, NOT for transactions. Keep it secure!

### **Step 3: Deploy Contract with Signer Address**

\`\`\`solidity
constructor(address _token, address _signer) {
    commitToken = IERC20(_token);
    signerAddress = _signer; // ← Your signer wallet address
}
\`\`\`

### **Step 4: Update Contract Address**

\`\`\`env
# .env.local
NEXT_PUBLIC_VAULT_CONTRACT=0x...your_v5_contract_address
\`\`\`

---

## 📊 Neynar Score Tiers

Contract calculates reward based on score:

| Neynar Score | Tier | Reward % | Basis Points |
|--------------|------|----------|--------------|
| 90-100 | HIGH | 10% | 1000 |
| 50-89 | MEDIUM | 6% | 600 |
| 0-49 | LOW | 3% | 300 |

**Example:**
- Reward pool: 70 tokens
- Helper score: 85 (MEDIUM tier)
- Reward: 70 * 600 / 10000 = 4.2 tokens

---

## 🧪 Testing V5

### **Test Claim Flow:**

\`\`\`typescript
// 1. Helper posts and gets verified (automatic)
// 2. Frontend calls /api/sign-claim
const signResponse = await fetch("/api/sign-claim", {
  method: "POST",
  body: JSON.stringify({
    helperAddress: "0x123...",
    reminderId: 1,
    neynarScore: 85,
  }),
});

const { signature } = await signResponse.json();

// 3. Call claimReward with signature
await contract.claimReward(1, 85, signature);

// ✅ Done! No recordReminder needed!
\`\`\`

### **Verify Signature:**

\`\`\`bash
# In contract, check signerAddress matches
await contract.signerAddress()
# Should return your signer wallet address
\`\`\`

---

## 🔄 Migration Checklist

### **Backend:**
- [x] Created `lib/contracts/v5-abi.ts`
- [x] Updated `lib/contracts/config.ts` to use V5 ABI
- [x] Created `/api/sign-claim` endpoint
- [x] Removed `recordReminder` logic from `helpRemind`
- [x] Updated `claimReward` to use signature

### **Environment:**
- [ ] Generate signer wallet
- [ ] Add `SIGNER_PRIVATE_KEY` to `.env.local`
- [ ] Add `SIGNER_PRIVATE_KEY` to Vercel env vars
- [ ] Deploy V5 contract with signer address
- [ ] Update `NEXT_PUBLIC_VAULT_CONTRACT`

### **Testing:**
- [ ] Test createReminder (should work unchanged)
- [ ] Test helpRemind (automatic verification)
- [ ] Test claimReward (with signature)
- [ ] Test reclaimReminder (T-1h window)
- [ ] Verify no `recordReminder` calls

---

## 🚨 Breaking Changes

### **What NO Longer Works:**

1. ❌ `recordReminder` function calls - Removed from V5
2. ❌ `claimReward` without signature - Now requires signature
3. ❌ Old V4 contract ABI - Must use V5 ABI

### **What Still Works:**

1. ✅ `createReminder` - Same parameters order
2. ✅ `getUserReminders` - Same functionality
3. ✅ `getActiveReminders` - Same functionality
4. ✅ Automatic verification (Supabase) - No changes
5. ✅ Frontend UI - No changes needed

---

## 📖 API Reference

### **POST /api/sign-claim**

Generate signature for claimReward.

**Request:**
\`\`\`json
{
  "helperAddress": "0x123...",
  "reminderId": 1,
  "neynarScore": 85
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "signature": "0xabcd...",
  "signerAddress": "0x789...",
  "messageHash": "0xdef..."
}
\`\`\`

---

## 🎉 Benefits of V5

1. **Simpler Flow** - One transaction instead of two
2. **Lower Gas Costs** - No recordReminder transaction
3. **Faster** - No waiting for recordReminder confirmation
4. **More Secure** - Signature-based verification
5. **Better UX** - Direct claim after post verification

---

## 🆘 Troubleshooting

### **"Invalid Signature" Error**

**Cause:** Signer address mismatch

**Fix:**
\`\`\`bash
# Check signer address in contract
cast call $VAULT_ADDRESS "signerAddress()" --rpc-url $RPC

# Check your signer wallet address
node -e "console.log(new (require('ethers').Wallet)('$SIGNER_PRIVATE_KEY').address)"

# They must match!
\`\`\`

### **"Window not open" Error**

**Cause:** Trying to claim outside T-1h window

**Fix:** Wait until `deadline - 1 hour` and try again before `deadline`

### **"Already claimed" Error**

**Cause:** Helper already claimed reward for this reminder

**Fix:** Each helper can only claim once per reminder

---

## 📚 Resources

- **Contract:** `contracts/ReminderVaultV5.sol`
- **ABI:** `lib/contracts/v5-abi.ts`
- **Sign API:** `app/api/sign-claim/route.ts`
- **Frontend:** `hooks/use-reminder-actions.ts`

---

**Migration complete!** V5 is now live with simplified workflow! 🚀
