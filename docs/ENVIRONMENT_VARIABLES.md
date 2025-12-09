# Environment Variables Guide

This document explains all environment variables needed for the CommitRemind app and how to obtain them.

---

## 🔗 Blockchain Configuration

### `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
**Required:** Yes  
**Description:** RPC endpoint URL for connecting to Base Sepolia testnet  
**Where to get it:**
1. Go to [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)
2. Create a free account
3. Create a new app and select "Base Sepolia" as the network
4. Copy the HTTPS endpoint URL

**Example:**
\`\`\`
https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
\`\`\`

**Alternative (Public RPC - not recommended for production):**
\`\`\`
https://sepolia.base.org
\`\`\`

---

### `NEXT_PUBLIC_CONTRACT_ADDRESS`
**Required:** Yes  
**Description:** The deployed CommitToken (ERC20) smart contract address on Base Sepolia  
**Where to get it:**
1. Deploy the contracts using the deployment script (see DEPLOYMENT.md)
2. After deployment, copy the "CommitToken deployed to:" address
3. Paste it here

**Example:**
\`\`\`
0x1234567890123456789012345678901234567890
\`\`\`

**Status:** This variable already exists in your project but needs to be filled after contract deployment.

---

### `NEXT_PUBLIC_VAULT_CONTRACT`
**Required:** Yes  
**Description:** The deployed ReminderVault smart contract address on Base Sepolia  
**Where to get it:**
1. Deploy the contracts using the deployment script (see DEPLOYMENT.md)
2. After deployment, copy the "ReminderVault deployed to:" address
3. Paste it here

**Example:**
\`\`\`
0x0987654321098765432109876543210987654321
\`\`\`

**Status:** This variable already exists in your project but needs to be filled after contract deployment.

---

### `DEPLOYER_PRIVATE_KEY`
**Required:** Yes (for deployment only)  
**Description:** Private key of the wallet that will deploy the smart contracts and own them initially  
**Where to get it:**
1. Create a new wallet in MetaMask or your preferred wallet
2. Export the private key (Settings → Security & Privacy → Reveal Private Key)
3. **⚠️ NEVER share this or commit it to git!**
4. Fund this wallet with Base Sepolia ETH for gas fees

**How to get Base Sepolia ETH:**
- Use [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- Or bridge from Ethereum Sepolia

**Example:**
\`\`\`
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
\`\`\`

**⚠️ Security:** Only use this for deployment scripts, never expose in client-side code.

---

## 🎭 Farcaster Integration

### `NEXT_PUBLIC_APP_URL`
**Required:** Yes  
**Description:** The public URL where your app is hosted (used for Farcaster frame redirects)  
**Where to get it:**
1. If testing locally: `http://localhost:3000`
2. If deployed: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

**Example:**
\`\`\`
https://commitremind.vercel.app
\`\`\`

---

### `FARCASTER_APP_FID`
**Required:** Yes (for sending notifications)  
**Description:** Your Farcaster App's FID (Farcaster ID)  
**Where to get it:**
1. Go to [Warpcast](https://warpcast.com/)
2. Sign in with your Farcaster account
3. Go to Settings → Advanced → Developer
4. Create a new app or use your existing app
5. Copy the FID number

**Example:**
\`\`\`
12345
\`\`\`

---

### `FARCASTER_APP_MNEMONIC`
**Required:** Yes (for signing frames)  
**Description:** The mnemonic phrase for your Farcaster app signer  
**Where to get it:**
1. When you create a Farcaster app, you'll receive a mnemonic phrase
2. Alternatively, you can generate one using a wallet
3. **⚠️ NEVER share this or commit it to git!**

**Example:**
\`\`\`
word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12
\`\`\`

**⚠️ Security:** Keep this secret and never expose it client-side.

---

### `FARCASTER_API_KEY`
**Required:** Yes (for notifications)  
**Description:** API key for Warpcast/Neynar API to send notifications  
**Where to get it:**

**Option 1: Neynar (Recommended)**
1. Go to [Neynar](https://neynar.com/)
2. Sign up for a free account
3. Create a new API key
4. Copy the API key

**Option 2: Direct Warpcast API**
1. Contact Warpcast team for API access
2. Not publicly available yet for all users

**Example:**
\`\`\`
neynar_api_key_1234567890abcdef
\`\`\`

---

## 📋 Quick Setup Checklist

### Step 1: Blockchain Setup
- [ ] Get Base Sepolia RPC URL from Alchemy/Infura
- [ ] Create a deployer wallet and get the private key
- [ ] Fund deployer wallet with Base Sepolia ETH
- [ ] Add `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
- [ ] Add `DEPLOYER_PRIVATE_KEY`

### Step 2: Deploy Contracts
- [ ] Run deployment script: `npm run deploy`
- [ ] Copy CommitToken address to `NEXT_PUBLIC_CONTRACT_ADDRESS`
- [ ] Copy ReminderVault address to `NEXT_PUBLIC_VAULT_CONTRACT`

### Step 3: Farcaster Setup
- [ ] Create/use Farcaster account
- [ ] Create Farcaster app and get FID
- [ ] Get app mnemonic
- [ ] Sign up for Neynar and get API key
- [ ] Add `FARCASTER_APP_FID`
- [ ] Add `FARCASTER_APP_MNEMONIC`
- [ ] Add `FARCASTER_API_KEY`

### Step 4: App Deployment
- [ ] Deploy to Vercel
- [ ] Get deployment URL
- [ ] Add `NEXT_PUBLIC_APP_URL` with your Vercel URL
- [ ] Test the app!

---

## 🔒 Security Best Practices

1. **Never commit sensitive keys** to git
   - Use `.env.local` for local development
   - Add `.env.local` to `.gitignore` (already done)

2. **Use environment variables in Vercel**
   - Add all `NEXT_PUBLIC_*` vars as environment variables
   - Add private keys only in Vercel dashboard (not in code)

3. **Separate test and production**
   - Use different wallets for testnet and mainnet
   - Use different Farcaster apps for test and production

4. **Rotate keys regularly**
   - Change API keys every few months
   - Never reuse private keys

---

## 🚀 Moving to Base Mainnet

When you're ready to move from Base Sepolia to Base Mainnet:

1. **Deploy new contracts on Base Mainnet**
   - Update RPC URL to Base Mainnet
   - Use a funded mainnet wallet
   - Deploy contracts with real value considerations

2. **Update environment variables**
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` → Base Mainnet RPC
   - New `NEXT_PUBLIC_CONTRACT_ADDRESS` (mainnet)
   - New `NEXT_PUBLIC_VAULT_CONTRACT` (mainnet)

3. **Launch your token**
   - Consider liquidity, tokenomics, and distribution
   - List on DEXs if needed
   - Announce to the community

4. **Update Farcaster app**
   - Use production Farcaster app credentials
   - Update `NEXT_PUBLIC_APP_URL` to production domain

---

## 📞 Need Help?

- **Base Sepolia Issues:** [Base Discord](https://discord.gg/buildonbase)
- **Farcaster Issues:** [Farcaster Dev Docs](https://docs.farcaster.xyz/)
- **Neynar Support:** [Neynar Docs](https://docs.neynar.com/)
