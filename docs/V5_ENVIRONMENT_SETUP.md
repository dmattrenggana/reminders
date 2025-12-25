# 🔧 V5 Environment Setup Guide

## Required Environment Variables

Add these to your `.env.local` file:

\`\`\`env
# Smart Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_commit_token_address
NEXT_PUBLIC_VAULT_CONTRACT=0x...your_v5_vault_contract_address

# RPC (QuickNode)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://your-endpoint.base-mainnet.quiknode.pro/YOUR-API-KEY/

# Neynar (Farcaster)
NEYNAR_API_KEY=your_neynar_api_key

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# V5 Signature Verification (NEW!)
SIGNER_PRIVATE_KEY=0x...your_signer_wallet_private_key
\`\`\`

---

## 🔐 Generate Signer Wallet (NEW for V5)

### **Step 1: Generate Private Key**

\`\`\`bash
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
\`\`\`

Output example:
\`\`\`
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
\`\`\`

### **Step 2: Get Signer Address**

\`\`\`bash
node -e "console.log(new (require('ethers').Wallet)('0x1234567890abcdef...').address)"
\`\`\`

Output example:
\`\`\`
0xabcdef1234567890abcdef1234567890abcdef12
\`\`\`

### **Step 3: Add to .env.local**

\`\`\`env
SIGNER_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
\`\`\`

### **Step 4: Deploy V5 Contract**

When deploying V5 contract, use the signer address:

\`\`\`solidity
constructor(
    address _token,
    address _signer  // ← Your signer address from Step 2
)
\`\`\`

Example:
\`\`\`bash
# Deploy with Hardhat/Foundry
forge create ReminderVaultV5 \
  --constructor-args $TOKEN_ADDRESS $SIGNER_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
\`\`\`

---

## ⚠️ Security Notes

1. **SIGNER_PRIVATE_KEY:**
   - Used ONLY for signing claim messages
   - Does NOT need ETH or any tokens
   - Keep it SECRET and secure
   - Never commit to git
   - Add to `.gitignore` (already done)

2. **SUPABASE_SERVICE_ROLE_KEY:**
   - Server-side only
   - Never expose to client
   - Has full database access

3. **Production Deployment (Vercel):**
   - Add all env vars to Vercel Project Settings
   - Mark sensitive keys as "Sensitive" in Vercel
   - Different values for dev/staging/production

---

## 🚀 Quick Setup Script

Create this script to help with setup:

**`scripts/setup-v5-signer.js`:**

\`\`\`javascript
const { Wallet } = require('ethers');

console.log('🔐 Generating V5 Signer Wallet...\n');

const wallet = Wallet.createRandom();

console.log('✅ Generated!\n');
console.log('📋 Add these to your .env.local:\n');
console.log(`SIGNER_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`\n🔑 Signer Address (use in contract deployment):`);
console.log(`${wallet.address}`);
console.log('\n⚠️  KEEP PRIVATE KEY SECURE! Never commit to git.\n');
\`\`\`

**Run:**

\`\`\`bash
node scripts/setup-v5-signer.js
\`\`\`

---

## ✅ Verify Setup

### **1. Check Environment Variables:**

\`\`\`bash
# In your project directory
node -e "require('dotenv').config({path:'.env.local'}); console.log('SIGNER_PRIVATE_KEY:', process.env.SIGNER_PRIVATE_KEY ? '✅ Set' : '❌ Missing')"
\`\`\`

### **2. Check Contract Signer Address:**

\`\`\`bash
# Query contract
cast call $VAULT_ADDRESS "signerAddress()" --rpc-url $RPC
\`\`\`

Should match your signer wallet address!

### **3. Test Signature Generation:**

\`\`\`bash
# Start dev server
npm run dev

# Test API endpoint
curl -X POST http://localhost:3000/api/sign-claim \
  -H "Content-Type: application/json" \
  -d '{"helperAddress":"0x123...","reminderId":1,"neynarScore":85}'
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "signature": "0xabcd...",
  "signerAddress": "0x789...",
  "messageHash": "0xdef..."
}
\`\`\`

---

## 🔄 Migration from V4

If you already have a `.env.local` from V4, just add:

\`\`\`env
# Add this line
SIGNER_PRIVATE_KEY=0x...your_new_signer_private_key
\`\`\`

And update:

\`\`\`env
# Update this line with V5 contract address
NEXT_PUBLIC_VAULT_CONTRACT=0x...your_v5_contract_address
\`\`\`

All other env vars stay the same! ✅

---

## 📚 Related Docs

- [V5 Contract Migration](./V5_CONTRACT_MIGRATION.md)
- [Supabase Setup](./SUPABASE_SETUP_QUICKSTART.md)
- [Testing Guide](./TESTING_GUIDE_FINAL.md)

---

**Setup complete!** You're ready to use V5! 🎉
