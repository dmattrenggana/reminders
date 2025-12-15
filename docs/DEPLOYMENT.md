# Smart Contract Deployment Guide

## Prerequisites

1. Install dependencies:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npm install @openzeppelin/contracts ethers
   ```

2. Set up environment variables:
   ```
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
   ```

## Deployment Steps

### 1. Compile Contracts
```bash
npx hardhat compile
```

### 2. Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy-contracts.ts --network base
```

### 3. Verify Contracts (Optional)
```bash
npx hardhat verify --network base COMMIT_TOKEN_ADDRESS "CommitToken" "RMND" "1000000"
npx hardhat verify --network base REMINDER_VAULT_ADDRESS COMMIT_TOKEN_ADDRESS
```

### 4. Update Environment Variables
Add the deployed contract addresses to your `.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_VAULT_CONTRACT=0x...
```

## Contract Functionality

### CommitToken (ERC20)
- Standard ERC20 token with mint and burn functions
- Used as collateral for reminders
- Owner can mint new tokens

### ReminderVault
- **createReminder**: Lock tokens and create a reminder
- **confirmReminder**: Confirm reminder and reclaim tokens (available 1hr before reminder time)
- **burnMissedReminder**: Burn tokens if user misses confirmation deadline
- **getUserReminders**: Get all reminder IDs for a user
- **getReminder**: Get detailed reminder information

## Important Notes

- Notifications start 1 hour before reminder time
- Users can confirm anytime from notification start until 1 hour after reminder time
- Tokens are automatically burnable after the confirmation deadline passes
- Anyone can call burnMissedReminder to enforce the penalty

## Network Information

- **Network**: Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Block Explorer**: https://basescan.org
