# Deploy ReminderVaultV3 Contract

## What's New in V3

The V3 contract adds the ability to withdraw unclaimed rewards after confirmation:

- When you confirm a reminder, you immediately get back your commitment amount (50%)
- Helpers have 24 hours to claim their share of the reward pool (50%)
- After 24 hours, you can call `withdrawUnclaimedRewards()` to get back any unclaimed portion

## Key Features

1. **50/50 Split**: Half commitment (returned/burned), half reward pool (for helpers)
2. **Neynar Score Weighting**: Rewards distributed based on helper influence
3. **24-Hour Claim Window**: Helpers have 24 hours after confirmation to claim
4. **Unclaimed Withdrawal**: Owner can withdraw unclaimed rewards after window expires
5. **Auto-burn**: Cron job burns missed reminders automatically

## Deployment Steps Using Remix

### Step 1: Prepare Contract Code

Copy the entire code from `contracts/ReminderVaultV3.sol`

### Step 2: Deploy in Remix

1. Go to https://remix.ethereum.org
2. Create new file: `ReminderVaultV3.sol`
3. Paste the contract code
4. Compile with Solidity 0.8.20
5. Deploy to Base Sepolia with constructor argument: your COMMIT token address
6. Copy the deployed contract address

### Step 3: Update Environment Variables

Update in Vercel:
- `NEXT_PUBLIC_VAULT_CONTRACT` = new V3 contract address
- `NEXT_PUBLIC_REMINDER_VAULT_ADDRESS` = same new V3 contract address

### Step 4: Verify on Basescan (Optional)

Use the flattened version for verification with compiler 0.8.20 and optimization settings

## New Functions

### For Users

- `withdrawUnclaimedRewards(uint256 reminderId)` - Withdraw unclaimed rewards 24 hours after confirmation
- `canWithdrawUnclaimed(uint256 reminderId)` - Check if you can withdraw unclaimed rewards
- `getUnclaimedAmount(uint256 reminderId)` - Get the amount of unclaimed rewards available

### Example Flow

1. Create reminder with 100 tokens (50 commit + 50 reward pool)
2. Confirm on time → get back 50 tokens (commit amount)
3. Wait 24 hours
4. If no one claimed rewards, call `withdrawUnclaimedRewards()` → get back the remaining 50 tokens
5. Total recovered: 100 tokens (full amount)

If helpers claimed 30 tokens, you get back 20 tokens after 24 hours.
