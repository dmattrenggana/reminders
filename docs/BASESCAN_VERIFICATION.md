# Basescan Contract Verification Guide

## Step-by-Step Verification for ReminderVaultV3

### 1. Go to Basescan
Visit: https://basescan.org/verifyContract

### 2. Enter Contract Details

**Contract Address:** Your deployed vault address (from `NEXT_PUBLIC_VAULT_CONTRACT`)

### 3. Compiler Settings

- **Compiler Type:** Solidity (Single file)
- **Compiler Version:** v0.8.20+commit.a1b79de6
- **Open Source License Type:** MIT

### 4. Contract Source Code

Copy the entire flattened contract from: `/contracts/ReminderVaultV3_Flattened.sol`

### 5. Constructor Arguments (ABI-encoded)

You need to encode your token address. Use this format:

\`\`\`
000000000000000000000000[YOUR_TOKEN_ADDRESS_WITHOUT_0x]
\`\`\`

**Example:** If your token address is `0x1234567890123456789012345678901234567890`, the constructor argument would be:
\`\`\`
0000000000000000000000001234567890123456789012345678901234567890
\`\`\`

**Easy way to get this:**
- Go to: https://abi.hashex.org/
- Select "Constructor"
- Type: `address`
- Value: Your token address
- Click "Encode"

### 6. Optimization Settings

- **Optimization:** Yes
- **Runs:** 200

### 7. Submit

Click "Verify and Publish"

## Troubleshooting

### Error: "Bytecode doesn't match"
- Make sure you're using Solidity 0.8.20
- Ensure optimization is set to Yes with 200 runs
- Double-check the constructor argument encoding

### Error: "Constructor arguments invalid"
- Verify your token address is correct
- Make sure the ABI encoding is in the correct format (64 hex characters without 0x prefix)

### Need to verify your token contract?
Use the same process but with the CommitToken.sol contract instead.

## After Verification

Once verified, you can:
- View your contract code on Basescan
- See all transactions and events
- Interact with your contract directly from Basescan
- Users can verify they're interacting with the correct contract
