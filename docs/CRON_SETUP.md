# Cron Job Setup Guide

## Overview

The reminder system uses automated cron jobs to process expired reminders and burn tokens when users miss their commitments.

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
- This wallet needs a small amount of ETH for gas fees
- **Keep this SECRET** - never expose publicly
- Get from MetaMask: Account Details → Export Private Key

### `BASE_SEPOLIA_RPC_URL`
- Already configured: Uses your existing RPC URL
- No additional setup needed

## Setup Steps

1. **Create a Cron Wallet**
   ```
   - Create new MetaMask wallet
   - Export private key
   - Fund with 0.01 ETH for gas (Base Sepolia)
   ```

2. **Add Environment Variables in Vercel**
   ```
   CRON_SECRET=your-secure-random-string
   CRON_WALLET_PRIVATE_KEY=0x...your-private-key
   ```

3. **Deploy**
   - Push to Vercel
   - Cron will automatically start running if using Vercel Pro plan

## Vercel Plans & Cron Jobs

### Free Hobby Plan (Current)

The Vercel Hobby plan does **NOT support** automated cron jobs. You have two options:

#### Option 1: Use External Free Cron Service (Recommended)

Services like **cron-job.org** or **EasyCron** can trigger your endpoint for free:

1. **Sign up** at cron-job.org (free)
2. **Create new cron job**:
   - URL: `https://your-app.vercel.app/api/cron/process-reminders`
   - Schedule: Every hour
   - HTTP Method: GET
   - Add Header: `Authorization: Bearer your-cron-secret`
3. **Save and activate**

#### Option 2: Manual Processing

Add a manual "Process Reminders" button in your admin UI that calls the cron endpoint.

### Pro Plan ($20/month)

Upgrade to Vercel Pro for native cron job support:
- Automatic hourly processing
- Better reliability
- Integrated monitoring

## Testing

Test manually by calling:
```bash
curl -X GET https://your-app.vercel.app/api/cron/process-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

## Monitoring

View cron logs in Vercel dashboard:
- Go to your project
- Click "Deployments"
- Select latest deployment
- Check "Functions" tab
- Find `/api/cron/process-reminders`

## Limitations

- **Vercel Hobby**: Runs every hour max (if using external cron service)
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
