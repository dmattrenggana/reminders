# Quick Start Guide - Deploy & Test Your App

## Prerequisites
- [ ] Base Sepolia testnet ETH in your wallet (get free from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- [ ] Your wallet private key
- [ ] Environment variables added in v0 (RPC URL and APP URL)

## Step 1: Get Base Sepolia Testnet ETH

1. Go to [Coinbase Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Connect your wallet
3. Request testnet ETH (you'll need ~0.1 ETH for deployment)

## Step 2: Deploy Smart Contracts

### Option A: Using v0 (Recommended for non-coders)

1. Add your deployer private key to environment variables:
   - Go to **Vars** section in v0 sidebar
   - Add: `DEPLOYER_PRIVATE_KEY` = `your_wallet_private_key`
   
2. The deployment script will run automatically when you publish the app

3. After deployment, you'll see the contract addresses in the console
   - Copy the `CommitToken address`
   - Copy the `ReminderVault address`

4. Add these addresses to your environment variables:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` = the token address
   - `NEXT_PUBLIC_VAULT_CONTRACT` = the vault address

### Option B: Manual Deployment (For developers)

If you download the code and want to deploy manually:

```bash
# Install dependencies
npm install

# Deploy contracts
npm run deploy:sepolia

# Copy the addresses from the output
```

## Step 3: Test the App

1. **Connect Wallet**
   - Open the app
   - Click "Connect Wallet"
   - Connect your MetaMask or other Web3 wallet
   - Make sure you're on Base Sepolia network

2. **Get Test Tokens**
   - The app will show a "Mint Test Tokens" button
   - Click it to mint 1000 COMMIT tokens for testing
   - Confirm the transaction in your wallet

3. **Create a Reminder**
   - Click "Create Reminder"
   - Fill in:
     - Title (e.g., "Test my first reminder")
     - Description
     - Date & Time (set it 2-3 hours from now for testing)
     - Token amount to lock (e.g., 100 COMMIT)
   - Click "Create & Lock Tokens"
   - Approve the token spending (first transaction)
   - Confirm reminder creation (second transaction)

4. **Test Confirmation**
   - Wait until 1 hour before your reminder time
   - The reminder card will show "Confirm" button
   - Click it and sign the transaction
   - Your tokens will be returned!

5. **Test Burn Mechanism**
   - Create another reminder
   - Don't confirm it after the deadline passes
   - Check your vault - tokens should be burned

## Step 4: Setup Farcaster Integration (Optional)

For Farcaster notifications, you'll need:

1. **Create a Farcaster app**:
   - Go to [Farcaster Developer Portal](https://warpcast.com/~/developers)
   - Create a new app
   - Copy your FID and Mnemonic

2. **Get Neynar API Key**:
   - Go to [Neynar](https://neynar.com/)
   - Sign up and get an API key

3. **Add to environment variables**:
   - `FARCASTER_APP_FID`
   - `FARCASTER_APP_MNEMONIC`
   - `FARCASTER_API_KEY`

## Troubleshooting

**"Network Error"**
- Make sure you're connected to Base Sepolia network
- Check your RPC URL is correct

**"Insufficient Funds"**
- Get more Base Sepolia ETH from the faucet

**"Contract not deployed"**
- Make sure you've deployed the contracts
- Check that contract addresses are in environment variables

**Transaction Fails**
- Check you have enough Base Sepolia ETH for gas
- Make sure you've approved token spending first

## Next Steps

Once everything works on Base Sepolia:

1. Test thoroughly with multiple reminders
2. Invite friends to test
3. When ready, deploy to Base Mainnet (see DEPLOYMENT.md)
4. Launch your token!

## Need Help?

Check the detailed guides:
- `DEPLOYMENT.md` - Full deployment guide
- `ENVIRONMENT_VARIABLES.md` - All environment variables explained
- `FARCASTER_SETUP.md` - Farcaster integration details
