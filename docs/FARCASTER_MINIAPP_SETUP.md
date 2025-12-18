# Farcaster Mini App Setup Guide

## Prerequisites

1. Your app must be deployed and accessible via HTTPS
2. You need a Farcaster account with an FID

## Step 1: Create Required Assets

Create these image assets in your `public` folder:

### Icon (`public/icon.png`)
- Size: 200x200px minimum
- Format: PNG with transparency recommended
- Must be accessible at: `https://yourdomain.com/icon.png`

### Splash Screen (`public/splash.png`)
- Size: 1080x1920px recommended (mobile portrait)
- Format: PNG or JPG
- Must be accessible at: `https://yourdomain.com/splash.png`

## Step 2: Update Manifest

The manifest is located at `public/.well-known/farcaster.json`

**Important: Update these values:**

1. **homeUrl**: Replace with your deployed URL
2. **iconUrl**: Replace with your deployed icon URL
3. **splashImageUrl**: Replace with your deployed splash URL
4. **webhookUrl**: Replace with your deployed webhook URL
5. **accountAssociation**: This requires signing with your Farcaster custody address

### Generate Account Association

To generate the proper `accountAssociation` signature:

```bash
# Use the Farcaster CLI or use the Warpcast developer portal
# This requires your custody private key
```

Or use Warpcast Developer Portal:
1. Go to https://warpcast.com/~/developers
2. Register your mini app
3. Get the proper accountAssociation signature

## Step 3: Verify Manifest

1. Deploy your app
2. Navigate to: `https://yourdomain.com/.well-known/farcaster.json`
3. Verify the JSON loads correctly
4. All URLs must be HTTPS and publicly accessible

## Step 4: Test on Mobile

1. Open Warpcast mobile app
2. Navigate to your mini app URL
3. The app should open in the Farcaster frame
4. Test wallet connection and transactions

## Common Issues

### Mini App Won't Open on Mobile
- Verify all URLs in manifest are HTTPS
- Check that icon and splash images are accessible
- Verify accountAssociation is properly signed

### User Info Shows "@user"
- Check Frame SDK initialization in auth context
- Verify the SDK context is available
- Check browser console for errors

### Transactions Fail
- Verify wallet permission is requested
- Check that ethProvider is available
- Ensure you're on Base Mainnet (chain ID 8453)

## Resources

- [Base Mini Apps Documentation](https://docs.base.org/mini-apps/)
- [Farcaster Frame SDK](https://github.com/farcasterxyz/miniapps)
- [Warpcast Developer Portal](https://warpcast.com/~/developers)
