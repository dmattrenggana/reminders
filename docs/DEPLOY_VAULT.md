# Deploy ReminderVault Contract

Since you already have your token deployed at `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08`, you just need to deploy the vault contract.

## Prerequisites

1. **Base Sepolia ETH** - Get free testnet ETH from:
   - https://www.alchemy.com/faucets/base-sepolia
   - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

2. **Add your private key** to environment variables:
   - Go to "Vars" section in sidebar
   - Add: `DEPLOYER_PRIVATE_KEY` = Your wallet's private key

## Deploy the Vault

Run the deployment script:

```bash
npx ts-node scripts/deploy-vault-only.ts
```

## After Deployment

1. **Copy the vault address** from the output
2. **Add to Vars section**:
   - `NEXT_PUBLIC_VAULT_CONTRACT` = The vault address you just deployed

## Test Everything

Once both addresses are in your Vars:
- `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08`
- `NEXT_PUBLIC_VAULT_CONTRACT` = (Your newly deployed vault address)

Your app is ready to test!
