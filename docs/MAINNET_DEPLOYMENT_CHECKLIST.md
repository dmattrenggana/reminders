# Base Mainnet Deployment Checklist

This guide walks you through deploying your token and vault contracts on Base Mainnet and configuring the app.

## Step 1: Deploy Contracts on Base Mainnet

### 1.1 Deploy CommitToken (Your Reward Token)

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create file `CommitToken.sol` and copy from `/contracts/CommitToken.sol`
3. Set compiler to Solidity 0.8.20+
4. Connect MetaMask to **Base Mainnet** (Chain ID: 8453)
5. Deploy with constructor parameters:
   - `name`: "Reminder Token" (or your choice)
   - `symbol`: "RMND" (or your choice)
   - `initialSupply`: 1000000 (mints 1,000,000 tokens to deployer)
6. **Copy the deployed address**: `0xABC123...`
7. Verify on BaseScan: https://basescan.org/address/YOUR_TOKEN_ADDRESS

### 1.2 Deploy ReminderVaultV3 (Reminder System)

1. In Remix, create file `ReminderVaultV3.sol` and copy from `/contracts/ReminderVaultV3.sol`
2. Compile with Solidity 0.8.20+
3. Still connected to **Base Mainnet**
4. Deploy with constructor parameter:
   - `_commitToken`: [Your token address from Step 1.1]
5. **Copy the deployed address**: `0xDEF456...`
6. Verify on BaseScan: https://basescan.org/address/YOUR_VAULT_ADDRESS

## Step 2: Configure Environment Variables

In your Vercel project or v0 workspace, add these environment variables:

### Required Variables

```bash
# Your deployed contract addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourTokenAddressFromStep1.1
NEXT_PUBLIC_VAULT_CONTRACT=0xYourVaultAddressFromStep1.2

# Base Mainnet RPC (use public or your own provider)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# App URL (your production domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Neynar API Key (for Farcaster integration)
NEYNAR_API_KEY=your_neynar_api_key

# Farcaster App Configuration
FARCASTER_APP_FID=your_app_fid
FARCASTER_SIGNER_UUID=your_signer_uuid

# Cron Job (for automated reminder burning)
CRON_SECRET=your_random_secret_string
CRON_WALLET_PRIVATE_KEY=your_wallet_private_key_for_cron
```

### Where to Set Environment Variables

**In Vercel:**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable above
4. Redeploy your app

**In v0:**
1. Click "Vars" in the left sidebar
2. Add each variable
3. The app will automatically use them

## Step 3: Verify Deployment

### 3.1 Check Contract Addresses

Visit BaseScan and verify:
- Token contract: https://basescan.org/address/YOUR_TOKEN_ADDRESS
- Vault contract: https://basescan.org/address/YOUR_VAULT_ADDRESS

Both should show "Contract" with green checkmark.

### 3.2 Test Token Approval

Before creating reminders, users need to approve the vault to spend tokens:
1. Visit your app
2. Connect wallet with MetaMask on Base Mainnet
3. Try creating a reminder
4. MetaMask will ask for 2 transactions:
   - Approve tokens (one-time)
   - Create reminder

### 3.3 Test Full Flow

1. **Create reminder**: Set amount and time
2. **Wait for helpers**: Check public feed
3. **Confirm reminder**: Within confirmation window
4. **Helpers claim**: After posting on Farcaster

## Step 4: Optional - Mint Additional Tokens

If you need more tokens, use the mint script:

```bash
# Set your token address
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourTokenAddress

# Run mint script (requires deployer wallet)
npm run mint-tokens
```

Or mint directly through BaseScan:
1. Go to your token contract on BaseScan
2. Contract → Write Contract → Connect Wallet
3. Call `mint` function with address and amount

## Troubleshooting

### "Insufficient allowance" error
Users need to approve the vault contract first. Make sure they approve enough tokens for their reminder.

### "Wrong network" error
Ensure MetaMask is connected to Base Mainnet (Chain ID: 8453), not Base Sepolia.

### Transactions failing
Check that:
- Contract addresses are correct in environment variables
- RPC URL is working (try https://mainnet.base.org)
- Wallet has enough ETH for gas on Base Mainnet

### Tokens not showing
- Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
- Check the contract on BaseScan
- Make sure you're viewing Base Mainnet, not testnet

## Summary Checklist

- [ ] Deploy CommitToken on Base Mainnet
- [ ] Deploy ReminderVaultV3 on Base Mainnet with token address
- [ ] Set `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable
- [ ] Set `NEXT_PUBLIC_VAULT_CONTRACT` environment variable
- [ ] Set `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` environment variable
- [ ] Set `NEYNAR_API_KEY` for Farcaster integration
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set `CRON_SECRET` and `CRON_WALLET_PRIVATE_KEY` for automation
- [ ] Redeploy app in Vercel/v0
- [ ] Test creating a reminder
- [ ] Verify on BaseScan that transactions work

## Next Steps

Once deployed and verified:
1. Share your app URL with users
2. Promote on Farcaster for helpers
3. Monitor contract activity on BaseScan
4. Consider verifying contracts on BaseScan for transparency

Your app is now live on Base Mainnet!
