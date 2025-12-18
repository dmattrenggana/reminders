# ReminderVault Deployment Guide

## Quick Deployment with Remix IDE

### Step 1: Open Remix IDE
Go to [https://remix.ethereum.org](https://remix.ethereum.org)

### Step 2: Create Contract File
1. Click the "File" icon in the left sidebar
2. Create a new file: `ReminderVault.sol`
3. Copy the contract code from `contracts/ReminderVault.sol` and paste it

### Step 3: Compile the Contract
1. Click the "Solidity Compiler" icon (left sidebar)
2. Select compiler version: `0.8.20` or higher
3. Click "Compile ReminderVault.sol"
4. Wait for successful compilation

### Step 4: Deploy the Contract
1. Click the "Deploy & Run Transactions" icon (left sidebar)
2. Set Environment to **"Injected Provider - MetaMask"**
3. Make sure MetaMask is connected to **Base Sepolia** network
4. In the CONTRACT dropdown, select **"ReminderVault"**
5. **IMPORTANT**: In the Deploy section, you'll see a text field for constructor parameter
6. Enter your token address: `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08`
7. Click **"Deploy"** (orange button)
8. Confirm the transaction in MetaMask

### Step 5: Copy the Deployed Address
1. After deployment, look in the "Deployed Contracts" section at the bottom
2. You'll see your contract with an address like `0x...`
3. Click the copy icon next to the contract address
4. **Save this address** - you'll need to add it to your environment variables

### Step 6: Add to Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - Key: `NEXT_PUBLIC_VAULT_CONTRACT`
   - Value: Your deployed vault address (e.g., `0x...`)
4. Redeploy your app

## Your Token Address
```
0x9e4F3d07B469ECA25055366913cC3F6e158d0A08
```

## Base Sepolia Network Details
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Block Explorer: https://sepolia.basescan.org

## Troubleshooting

### MetaMask not connecting?
- Make sure you're on Base Sepolia network
- Add Base Sepolia to MetaMask if needed:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency Symbol: ETH
  - Block Explorer: https://sepolia.basescan.org

### Need testnet ETH?
Get free Base Sepolia ETH from:
- [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [Coinbase Wallet Faucet](https://portal.cdp.coinbase.com/products/faucet)

### Deployment fails?
- Ensure you have enough Base Sepolia ETH for gas
- Double-check the token address is correct
- Make sure you're on Base Sepolia network, not Base Mainnet
