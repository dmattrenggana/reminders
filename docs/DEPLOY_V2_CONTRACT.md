# Deploy ReminderVault V2 Contract

## Overview

The ReminderVault V2 contract includes social reminder features with reward pools.

## Features

- **50% Commitment Tokens**: Burned if reminder is missed
- **50% Reward Pool**: Distributed to people who reminded you
- **Social Reminder Tracking**: Records who reminded you with Neynar scores
- **Automatic Burn**: Cron job burns missed reminders every hour

## Contract Updates

The updated `contracts/ReminderVaultV2.sol` includes:

1. Split token amounts into commitment and reward pool (50/50)
2. Social reminder recording with `recordReminder()`
3. Reward calculation and claiming with `calculateReward()` and `claimReward()`
4. Enhanced burn function that returns unclaimed reward pool

## Deployment Steps

### 1. Compile the Contract

**Using Remix (Easiest Method):**
1. Go to https://remix.ethereum.org
2. Create a new file: `ReminderVaultV2.sol`
3. Copy the contract code from `contracts/ReminderVaultV2.sol`
4. Click "Solidity Compiler" and compile with version `^0.8.20`
5. Click "Deploy & Run Transactions"
6. Select "Injected Provider - MetaMask"
7. Enter your COMMIT token address (get it from Vercel environment variables)
8. Click "Deploy" and confirm in MetaMask

**Using Hardhat:**
```bash
npx hardhat compile
```

**Using Foundry:**
```bash
forge build
```

### 2. Deploy to Base Sepolia

You'll need:
- Private key with Base Sepolia ETH for gas
- COMMIT token address from your Vercel environment variables

**Using Hardhat:**
```javascript
// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const commitTokenAddress = "YOUR_COMMIT_TOKEN_ADDRESS_HERE"; // Get from Vercel vars
  const ReminderVaultV2 = await ethers.getContractFactory("ReminderVaultV2");
  const vault = await ReminderVaultV2.deploy(commitTokenAddress);
  await vault.deployed();
  
  console.log("ReminderVaultV2 deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run:
```bash
npx hardhat run scripts/deploy.js --network base-sepolia
```

### 3. Update Environment Variables

After deployment, update `NEXT_PUBLIC_REMINDER_VAULT_ADDRESS` in Vercel with your new contract address.

### 4. Verify Contract (Optional)

```bash
npx hardhat verify --network base-sepolia <contract_address> <commit_token_address>
```

## Testing

After deployment, test the new functions:

1. Create a reminder
2. Have someone call `recordReminder()` with their Neynar score
3. Confirm the reminder
4. Check if reward can be claimed with `canClaimReward()`
5. Claim the reward with `claimReward()`

## Cron Job

The cron job at `/api/cron/process-reminders` will automatically:
- Check for expired reminders every hour
- Call `burnMissedReminder()` for any missed reminders
- Burn commitment tokens (50%) to 0xdead address
- Return unclaimed reward pool (50%) to the reminder creator

## Important Notes

- Never commit private keys to git
- Test on testnet before mainnet deployment
- Ensure sufficient gas funds in deployment wallet
- Get token address from Vercel environment variables (never hardcode)
- Update the vault address in Vercel after deployment
