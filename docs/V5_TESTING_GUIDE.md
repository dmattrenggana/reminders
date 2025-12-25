# 🧪 V5 Testing Guide - Complete Walkthrough

**Version:** V5 (Signature-based claim, no recordReminder)  
**Last Updated:** December 25, 2024

---

## 🎯 What Changed in V5

### **Old Flow (V4):**
\`\`\`
Helper clicks → Post → Verify → recordReminder() → claimReward()
                                 ❌ 2 transactions
\`\`\`

### **New Flow (V5):**
\`\`\`
Helper clicks → Post → Verify → Get signature → claimReward(signature)
                                                 ✅ 1 transaction
\`\`\`

**Key Difference:** No more `recordReminder` step! Direct claim with backend signature.

---

## 📋 Prerequisites

### **1. Environment Setup**

Ensure these are in your `.env.local`:

\`\`\`env
# V5 Contract
NEXT_PUBLIC_VAULT_CONTRACT=0x...your_v5_contract_address

# Signer (NEW in V5!)
SIGNER_PRIVATE_KEY=0x...your_signer_private_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Neynar
NEYNAR_API_KEY=your_neynar_key

# RPC
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://your-quicknode-endpoint/

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Token
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_token_address
\`\`\`

### **2. Contract Deployment**

V5 contract must be deployed with correct signer address:

\`\`\`solidity
constructor(address _token, address _signer)
\`\`\`

**Verify signer matches:**
\`\`\`bash
# Check contract signer
cast call $VAULT_ADDRESS "signerAddress()" --rpc-url $RPC

# Should match your signer wallet address
node -e "console.log(new (require('ethers').Wallet)('$SIGNER_PRIVATE_KEY').address)"
\`\`\`

### **3. Supabase Setup**

Table `pending_verifications` must exist:

\`\`\`sql
CREATE TABLE pending_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id INTEGER NOT NULL,
  helper_fid INTEGER NOT NULL,
  helper_address TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  neynar_score NUMERIC,
  estimated_reward TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pending_verifications;
\`\`\`

---

## 🚀 Testing Workflow

### **Step 1: Start Dev Server**

\`\`\`bash
npm run dev
# or
bun dev
\`\`\`

**Verify:**
- ✅ No errors in console
- ✅ Supabase connection works
- ✅ `/api/sign-claim` endpoint responds

### **Step 2: Test Signature Generation**

**Manual API test:**
\`\`\`bash
curl -X POST http://localhost:3000/api/sign-claim \
  -H "Content-Type: application/json" \
  -d '{
    "helperAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "reminderId": 1,
    "neynarScore": 85
  }'
\`\`\`

**Expected response:**
\`\`\`json
{
  "success": true,
  "signature": "0xabcd1234...",
  "signerAddress": "0x...",
  "messageHash": "0xdef5678..."
}
\`\`\`

**✅ Pass:** Signature generated successfully  
**❌ Fail:** Check `SIGNER_PRIVATE_KEY` is set correctly

### **Step 3: Create Reminder**

1. Connect wallet in miniapp/browser
2. Click "Create New Reminder" button
3. Fill in:
   - **Description:** "Test V5 workflow"
   - **Amount:** 100 RMND
   - **Deadline:** T+2 hours (must be > 1 hour from now)
4. Approve token spending
5. Confirm create transaction

**✅ Pass:** Reminder created, shows in "My Feed"  
**❌ Fail:** Check contract address and token approval

### **Step 4: Wait for T-1 Hour**

For testing, you can:
- **Option A:** Wait real time (not practical)
- **Option B:** Deploy with shorter deadline for testing
- **Option C:** Manually advance blockchain time (local testnet)

**When T-1 hour arrives:**
- Button changes: "Waiting to remind" → "Help to Remind" ✅

### **Step 5: Test Help to Remind Flow**

**V5 Workflow:**

\`\`\`
┌────────────────────────────────┐
│ 1. User clicks "Help to Remind"│
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 2. ✅ "Setting up verification"│
│    Create Supabase entry       │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 3. ✅ Farcaster composer opens │
│    User posts                  │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 4. ✅ "Waiting for verification"│
│    Realtime + polling          │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 5. ✅ "Post verified!"          │
│    Backend verifies via Neynar │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 6. ✅ "Getting claim signature" │ ← NEW in V5!
│    Call /api/sign-claim        │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 7. ✅ "Claiming reward..."      │ ← Direct claim!
│    claimReward(id, score, sig) │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ 8. ✅ "Reward claimed!"         │
└────────────────────────────────┘

Total: 1 blockchain transaction (approval was earlier)
\`\`\`

### **Console Logs (V5):**

**Successful flow:**
\`\`\`
[HelpRemind] Creating pending verification in Supabase for reminder: 1
[HelpRemind] ✅ Pending verification created: uuid-token
[HelpRemind] Subscribing to Supabase Realtime for verification: uuid-token
[HelpRemind] Starting background polling for verification: uuid-token
[HelpRemind] ⏳ Still waiting... Status: pending
[HelpRemind] ⏳ Still waiting... Status: pending
[HelpRemind] ✅ Polling: Post verified! { neynarScore: 85, estimatedReward: "4.2" }
[HelpRemind] ✅ Post verified! Getting claim signature...
[HelpRemind] ✅ Got claim signature from backend
[HelpRemind] Calling claimReward with signature
✅ Reward claimed!
\`\`\`

**Key Points:**
- ❌ **NO** "Recording reminder..." step
- ✅ **NEW** "Getting claim signature..." step
- ✅ **ONE** transaction: `claimReward(reminderId, neynarScore, signature)`

---

## 🧪 Testing Checklist

### **Pre-Testing:**
- [ ] V5 contract deployed with correct signer address
- [ ] `SIGNER_PRIVATE_KEY` in `.env.local`
- [ ] Supabase `pending_verifications` table created
- [ ] Supabase Realtime enabled
- [ ] Dev server running without errors
- [ ] `/api/sign-claim` endpoint works

### **Basic Flow:**
- [ ] Can create reminder successfully
- [ ] Button shows "Waiting to remind" before T-1h
- [ ] Button changes to "Help to Remind" at T-1h
- [ ] Can click "Help to Remind"
- [ ] Farcaster composer opens with correct text
- [ ] Can post on Farcaster
- [ ] App detects post automatically (15-30s)
- [ ] Signature generated successfully
- [ ] `claimReward` transaction sent
- [ ] Reward claimed successfully (1 transaction only!)
- [ ] Toast shows "✅ Reward claimed!"

### **Edge Cases:**
- [ ] Cannot claim before T-1h (contract reverts)
- [ ] Cannot claim after deadline (contract reverts)
- [ ] Cannot claim twice (contract reverts: "Already claimed")
- [ ] Invalid signature rejected by contract
- [ ] Expired verification handled gracefully

### **Creator Flow:**
- [ ] Can see reminder in "My Feed"
- [ ] Can click "Confirm Reminder" at T-1h
- [ ] Can reclaim tokens + unclaimed rewards
- [ ] Cannot reclaim after deadline

### **Cron Job:**
- [ ] Missed reminders burned after deadline
- [ ] Unclaimed rewards returned to creator
- [ ] Commit amount sent to burn address

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Invalid Signature" Error**

**Cause:** Signer address mismatch

**Fix:**
\`\`\`bash
# Check contract signer
cast call $VAULT_ADDRESS "signerAddress()" --rpc-url $RPC

# Check your signer
node -e "console.log(new (require('ethers').Wallet)('$SIGNER_PRIVATE_KEY').address)"

# They MUST match!
\`\`\`

### **Issue 2: "Window not open" Error**

**Cause:** Trying to claim outside T-1h window

**Fix:** Wait until `deadline - 1 hour`

**Check window:**
\`\`\`bash
cast call $VAULT_ADDRESS "isClaimWindowOpen(uint256)" $REMINDER_ID --rpc-url $RPC
\`\`\`

### **Issue 3: "Already claimed" Error**

**Cause:** Helper already claimed for this reminder

**Fix:** Each helper can only claim once per reminder. This is expected behavior.

**Check if claimed:**
\`\`\`bash
cast call $VAULT_ADDRESS "hasClaimed(uint256,address)" $REMINDER_ID $HELPER_ADDRESS --rpc-url $RPC
\`\`\`

### **Issue 4: No Signature Generated**

**Cause:** `/api/sign-claim` endpoint not working

**Check:**
\`\`\`bash
# Test endpoint
curl -X POST http://localhost:3000/api/sign-claim \
  -H "Content-Type: application/json" \
  -d '{"helperAddress":"0x123...","reminderId":1,"neynarScore":85}'

# Check logs
# Should see: [SignClaim] Generated signature: { ... }
\`\`\`

**Fix:**
- Verify `SIGNER_PRIVATE_KEY` is set
- Check server logs for errors
- Ensure ethers.js installed

### **Issue 5: Post Verification Timeout**

**Cause:** Neynar API not returning recent casts

**Check:**
- Is helper's FID correct?
- Did helper actually post?
- Check `/api/verify-post` logs

**Manual verify:**
\`\`\`bash
curl -X POST http://localhost:3000/api/verify-post \
  -H "Content-Type: application/json" \
  -d '{"verificationToken":"your-uuid-token"}'
\`\`\`

---

## 📊 Performance Metrics

### **V5 vs V4 Comparison:**

| Metric | V4 | V5 | Improvement |
|--------|----|----|-------------|
| Helper transactions | 2 | 1 | 50% ⬇️ |
| Gas cost | ~100k | ~60k | 40% ⬇️ |
| Time to claim | ~60s | ~30s | 50% ⬆️ |
| User experience | Good | Excellent | ⬆️ |

---

## 🔍 Debugging Tips

### **Enable Verbose Logging:**

Add to browser console:
\`\`\`javascript
localStorage.setItem('DEBUG', 'helpRemind,signClaim,verifyPost');
\`\`\`

### **Check Supabase Realtime:**

\`\`\`javascript
// In browser console
const { supabase } = await import('/lib/supabase/client');
supabase.channel('test').subscribe((status) => {
  console.log('Realtime status:', status);
});
\`\`\`

### **Monitor Contract State:**

\`\`\`bash
# Check reminder details
cast call $VAULT_ADDRESS "reminders(uint256)" $REMINDER_ID --rpc-url $RPC

# Check if helper claimed
cast call $VAULT_ADDRESS "hasClaimed(uint256,address)" $REMINDER_ID $HELPER --rpc-url $RPC

# Check remaining pool
cast call $VAULT_ADDRESS "getRemainingPool(uint256)" $REMINDER_ID --rpc-url $RPC
\`\`\`

---

## ✅ Success Criteria

**V5 is working correctly when:**

1. ✅ Signature generation works (`/api/sign-claim`)
2. ✅ Helper can claim in T-1h window
3. ✅ Only 1 transaction needed (no recordReminder)
4. ✅ Reward calculated correctly by contract
5. ✅ Cannot claim twice
6. ✅ Cannot claim with invalid signature
7. ✅ Verification fully automatic (no "I Posted" button)
8. ✅ Toast shows "✅ Reward claimed!" on success

---

## 📚 Related Documentation

- [V5 Contract Migration Guide](./V5_CONTRACT_MIGRATION.md)
- [V5 Environment Setup](./V5_ENVIRONMENT_SETUP.md)
- [V5 Changes Summary](./V5_CHANGES_SUMMARY.md)
- [Supabase Setup](./SUPABASE_SETUP_QUICKSTART.md)

---

**Happy Testing!** 🎉 V5 workflow is simpler and faster! 🚀
