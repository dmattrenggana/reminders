# Simple Deployment Guide

Since you already have your token deployed, here's the simplest way to deploy the vault:

## Option 1: Use Remix IDE (No Command Line Needed)

1. **Go to Remix**: https://remix.ethereum.org

2. **Create new file** called `ReminderVault.sol` and paste the contract code from `contracts/ReminderVault.sol`

3. **Compile**:
   - Click "Solidity Compiler" tab (left sidebar)
   - Click "Compile ReminderVault.sol"

4. **Deploy**:
   - Click "Deploy & Run Transactions" tab
   - Set Environment to "Injected Provider - MetaMask"
   - Make sure MetaMask is on Base Sepolia network
   - In constructor field, paste your token address: `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08`
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Copy the deployed contract address** and add it to your Vars:
   - `NEXT_PUBLIC_VAULT_CONTRACT` = The address you just deployed

## Option 2: Use a Contract Deployment Service

1. **Go to**: https://basescan.org/contractsVerified
2. **Connect your wallet**
3. **Deploy ReminderVault.sol** with your token address as constructor parameter
4. **Copy the address** and add to Vars

## After Deployment

Your app needs both addresses in Vars:
- `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x9e4F3d07B469ECA25055366913cC3F6e158d0A08` ✅ (You have this)
- `NEXT_PUBLIC_VAULT_CONTRACT` = (Your deployed vault address)

Then you're ready to test!
