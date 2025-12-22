# Deploy ReminderVault Contract with Remix IDE

This guide walks you through deploying the ReminderVault smart contract using Remix IDE, the most reliable method for Solidity deployments.

## Prerequisites

1. MetaMask installed and configured
2. Base Sepolia ETH in your wallet ([Get free testnet ETH](https://www.alchemy.com/faucets/base-sepolia))
3. Your CommitToken address: `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08`

## Step-by-Step Deployment

### 1. Open Remix IDE

Visit [https://remix.ethereum.org](https://remix.ethereum.org)

### 2. Create Contract File

- Click the "File" icon in the left sidebar
- Create a new file called `ReminderVault.sol`
- Copy the contract code from `contracts/ReminderVault.sol` in your project

### 3. Compile Contract

- Click the "Solidity Compiler" icon (second icon in sidebar)
- Select compiler version: `0.8.20` or higher
- Click "Compile ReminderVault.sol"
- Wait for successful compilation

### 4. Configure Deployment

- Click the "Deploy & Run" icon (third icon in sidebar)
- **Environment**: Select "Injected Provider - MetaMask"
- MetaMask will prompt you to connect - approve it
- **Verify Network**: Ensure MetaMask shows "Base Sepolia" (Chain ID: 84532)
  - If not, switch networks in MetaMask

### 5. Set Constructor Parameter

In the "Deploy" section, you'll see a field next to the "Deploy" button:

\`\`\`
_COMMITTOKEN: 0x9e4F3d07B469ECA25055366913cC3F6e158d0A08
\`\`\`

Paste your token address: `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08`

### 6. Deploy Contract

- Click the orange "Deploy" button
- MetaMask will popup asking you to confirm the transaction
- Review the gas fees and click "Confirm"
- Wait for the transaction to complete (usually 10-30 seconds)

### 7. Copy Contract Address

After deployment:
- Look for "Deployed Contracts" section at bottom of Deploy panel
- You'll see your contract with an address like `0x1234...`
- Click the copy icon to copy the address

### 8. Add to Environment Variables

Go to your Vercel project or v0 Vars section and add:

\`\`\`
NEXT_PUBLIC_VAULT_CONTRACT=0xYourDeployedContractAddress
\`\`\`

### 9. Verify Deployment (Optional)

Visit BaseScan Sepolia to verify your contract:
- Go to [https://sepolia.basescan.org](https://sepolia.basescan.org)
- Search for your contract address
- You should see the deployment transaction

## Troubleshooting

**"Gas estimation failed"**
- Make sure you have enough Base Sepolia ETH
- Try increasing gas limit manually

**"Wrong network"**
- Switch MetaMask to Base Sepolia
- Network details: Chain ID 84532, RPC: https://sepolia.base.org

**"Constructor parameter error"**
- Ensure token address is correctly formatted with 0x prefix
- Address should be exactly 42 characters (0x + 40 hex digits)

## Next Steps

After successful deployment:
1. Add vault address to environment variables
2. Test creating a reminder with token locking
3. Test confirmation functionality
4. Verify burn mechanism works for missed reminders

Your commitment-based reminder app is now ready to use!
