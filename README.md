# Base Reminders - Never Miss What Matters

A commitment-based reminder system built on Base with Farcaster integration. Lock tokens as collateral for your reminders, get help from the community, and reward those who remind you.

## 🎯 Features

- **Token-Backed Reminders**: Lock RMND tokens (30% commit, 70% reward pool)
- **Community Helpers**: Other users can remind you and earn rewards
- **Smart Contract Security**: All logic runs on-chain on Base Mainnet
- **Farcaster Integration**: Post reminders and get verified automatically
- **Signature-Based Claims**: Secure reward distribution with EIP-712 signatures
- **Tier-Based Rewards**: Reward calculation based on Neynar User Quality Score
- **Auto-Burn Mechanism**: Miss confirmation? Commit amount burns, rewards returned
- **T-1 Hour Window**: Helpers can remind you starting 1 hour before deadline

## 🚀 V5 Features (Latest)

- ✅ **No recordReminder** - Direct claim with signature (1 transaction!)
- ✅ **EIP-712 Signatures** - Secure off-chain verification
- ✅ **Faster Claims** - 50% less transactions, 40% lower gas
- ✅ **Automatic Verification** - Supabase + Realtime for instant updates
- ✅ **Better UX** - No waiting between transactions

## 📖 How It Works

### **For Creators:**

\`\`\`
1. Create Reminder
   ├─ Lock 100 RMND (30 commit, 70 reward pool)
   ├─ Set description & deadline
   └─ Must be > 1 hour from now

2. Wait for T-1 Hour
   ├─ Helpers can start reminding you
   └─ You can confirm early (reclaim all)

3. Confirm or Burn
   ├─ Confirm: Get commit back + unclaimed rewards
   └─ Miss deadline: Commit burns, rewards return
\`\`\`

### **For Helpers:**

\`\`\`
1. Find Active Reminders
   └─ Browse "Public Feed"

2. At T-1 Hour: "Help to Remind"
   ├─ Click button
   ├─ Post template to Farcaster
   └─ Mention creator

3. Automatic Verification (V5!)
   ├─ Post detected via Neynar API
   ├─ Backend generates signature
   └─ claimReward(id, score, signature)

4. Reward Claimed! 🎉
   ├─ Based on your Neynar score
   ├─ High (90-100): 10% of pool
   ├─ Medium (50-89): 6% of pool
   └─ Low (0-49): 3% of pool
\`\`\`

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Blockchain**: Base Mainnet (Ethereum L2)
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Web3**: viem, wagmi, ethers.js v6
- **Database**: Supabase (Postgres + Realtime)
- **Social**: Farcaster SDK, Neynar API
- **Deployment**: Vercel

## 📝 Smart Contracts

### **ReminderVaultV5**

Core contract managing reminder logic:

- **30/70 Split**: 30% commitment, 70% reward pool
- **Signature Verification**: EIP-712 for secure claims
- **Tier-Based Rewards**: On-chain calculation from Neynar score
- **Strict T-1h Window**: Helper claims only in window
- **Auto-Burn**: Missed reminders burned after deadline

**Key Functions:**
\`\`\`solidity
createReminder(uint256 totalAmount, uint256 deadline, string description, string farcasterUsername)
claimReward(uint256 reminderId, uint256 neynarScore, bytes signature) // ← V5: With signature!
reclaimReminder(uint256 reminderId)
burnMissedReminder(uint256 reminderId)
\`\`\`

### **CommitToken (RMND)**

Standard ERC20 token with mint/burn functions.

## 🚀 Getting Started

### **Prerequisites**

- Node.js 22+
- Wallet (MetaMask/Coinbase Wallet/Farcaster Wallet)
- Base Mainnet ETH (for gas)
- RMND tokens

### **Installation**

1. **Clone and install:**
\`\`\`bash
git clone https://github.com/dmattrenggana/reminders
cd reminders
npm install
\`\`\`

2. **Generate signer wallet (V5):**
\`\`\`bash
node scripts/generate-signer.js
\`\`\`

3. **Setup environment variables:**
\`\`\`env
# Smart Contracts
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_rmnd_token
NEXT_PUBLIC_VAULT_CONTRACT=0x...your_v5_vault

# V5 Signature Signer (NEW!)
SIGNER_PRIVATE_KEY=0x...your_signer_private_key

# RPC (QuickNode)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://your-endpoint.base-mainnet.quiknode.pro/YOUR-API-KEY/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Neynar (Farcaster)
NEYNAR_API_KEY=your_neynar_api_key

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
\`\`\`

4. **Deploy V5 contract:**
\`\`\`bash
npx hardhat compile
npx hardhat run scripts/deploy-v5.ts --network base
\`\`\`

5. **Setup Supabase:**
\`\`\`sql
-- See docs/SUPABASE_SETUP_QUICKSTART.md
CREATE TABLE pending_verifications (...);
ALTER PUBLICATION supabase_realtime ADD TABLE pending_verifications;
\`\`\`

6. **Run development:**
\`\`\`bash
npm run dev
\`\`\`

### **Deployment**

Deploy to Vercel:
\`\`\`bash
vercel --prod
\`\`\`

**Remember to add all env vars to Vercel Project Settings!**

## 📚 Documentation

### **V5 (Latest):**
- [V5 Contract Migration Guide](docs/V5_CONTRACT_MIGRATION.md) - Complete V5 overview
- [V5 Environment Setup](docs/V5_ENVIRONMENT_SETUP.md) - Setup instructions
- [V5 Testing Guide](docs/V5_TESTING_GUIDE.md) - How to test V5
- [V5 Changes Summary](docs/V5_CHANGES_SUMMARY.md) - Quick reference

### **General:**
- [Supabase Setup](docs/SUPABASE_SETUP_QUICKSTART.md) - Database configuration
- [RPC Setup](docs/RPC_PREMIUM_SETUP.md) - QuickNode configuration
- [Cron Job Troubleshooting](docs/CRON_JOB_TROUBLESHOOTING.md) - Auto-burn setup

## 🏗️ Architecture

### **V5 Workflow:**

\`\`\`
┌─────────────────────────────────────────────────────────┐
│ CREATOR                                                 │
├─────────────────────────────────────────────────────────┤
│ 1. createReminder(100 RMND, deadline, desc)            │
│    ├─ 30 RMND committed                                │
│    └─ 70 RMND reward pool                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ HELPER (at T-1 hour)                                    │
├─────────────────────────────────────────────────────────┤
│ 1. Click "Help to Remind"                              │
│ 2. Post template to Farcaster                          │
│ 3. Backend verifies post (Neynar API)                  │
│ 4. Backend generates signature                         │
│    └─ sign(helperAddress, reminderId, neynarScore)    │
│ 5. claimReward(id, score, signature) ← 1 transaction! │
│    └─ Contract verifies signature                      │
│    └─ Contract calculates reward tier                  │
│    └─ Transfer reward to helper                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ CREATOR (before deadline)                               │
├─────────────────────────────────────────────────────────┤
│ Option A: Confirm early                                │
│    └─ reclaimReminder() → Get 30 + unclaimed rewards  │
│                                                         │
│ Option B: Miss deadline                                │
│    └─ burnMissedReminder() (cron job)                 │
│       ├─ 30 RMND burned                                │
│       └─ Unclaimed rewards return to creator           │
└─────────────────────────────────────────────────────────┘
\`\`\`

### **Reward Tiers:**

| Neynar Score | Tier | % of Pool | Example (70 RMND pool) |
|--------------|------|-----------|------------------------|
| 90-100 | HIGH | 10% | 7 RMND |
| 50-89 | MEDIUM | 6% | 4.2 RMND |
| 0-49 | LOW | 3% | 2.1 RMND |

## 🔐 Security

- ✅ All token logic on-chain
- ✅ ReentrancyGuard protection
- ✅ EIP-712 signature verification
- ✅ Non-custodial (users control wallets)
- ✅ Open-source contracts (verify on BaseScan)
- ✅ Signer wallet isolated (no transaction rights)

## 🗺️ Roadmap

- [x] V5 signature-based claims
- [x] Automatic post verification (Supabase)
- [x] Realtime updates
- [ ] Mobile app optimization
- [ ] Notification system (push notifications)
- [ ] Analytics dashboard
- [ ] Multi-token support
- [ ] Reminder templates

## 📄 License

MIT

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/dmattrenggana/reminders/issues)
- **Documentation:** See `/docs` folder
- **Farcaster:** Reach out on Farcaster

---

Built with 💜 on Base | Powered by Farcaster 🎩
