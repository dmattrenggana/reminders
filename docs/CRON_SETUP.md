# Cron Job Setup Guide

## Overview

The reminder system uses Vercel Cron Jobs to automatically process expired reminders and burn tokens when users miss their commitments.

## How It Works

1. **Hourly Check**: Cron runs every hour (`0 * * * *`)
2. **Scans Reminders**: Checks all reminders for expired deadlines
3. **Burns Tokens**: Automatically burns tokens for missed reminders
4. **Logs Results**: Returns processed reminders and any errors

## Environment Variables Required

Add these to your Vercel project:

### `CRON_SECRET`
- A secure random string to authenticate cron requests
- Generate with: `openssl rand -base64 32`
- Example: `your-secure-random-string-here`

### `CRON_WALLET_PRIVATE_KEY`
- Private key of a wallet that will execute transactions
- This wallet needs small amount of ETH for gas fees
- **Keep this SECRET** - never expose publicly
- Get from MetaMask: Account Details → Export Private Key

### `BASE_SEPOLIA_RPC_URL`
- Already configured: Uses your existing RPC URL
- No additional setup needed

## Setup Steps

1. **Create a Cron Wallet**
   \`\`\`
   - Create new MetaMask wallet
   - Export private key
   - Fund with 0.01 ETH for gas (Base Sepolia)
   \`\`\`

2. **Add Environment Variables in Vercel**
   \`\`\`
   CRON_SECRET=your-secure-random-string
   CRON_WALLET_PRIVATE_KEY=0x...your-private-key
   \`\`\`

3. **Deploy**
   - Push to Vercel
   - Cron will automatically start running

## Testing

Test manually by calling:
\`\`\`bash
curl -X GET https://your-app.vercel.app/api/cron/process-reminders \
  -H "Authorization: Bearer your-cron-secret"
\`\`\`

## Monitoring

View cron logs in Vercel dashboard:
- Go to your project
- Click "Deployments"
- Select latest deployment
- Check "Functions" tab
- Find `/api/cron/process-reminders`

## Limitations

- **Vercel Hobby**: Runs every hour max
- **Gas Costs**: Cron wallet needs ETH for transactions
- **Rate Limits**: Processes all reminders each run

## Security

- Cron endpoint requires `CRON_SECRET` header
- Private key stored securely in Vercel
- Only processes legitimate expired reminders

## Cost Estimate

- Gas per burn: ~0.0001 ETH
- 100 burns: ~0.01 ETH
- Refill wallet when balance low
