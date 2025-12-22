# Farcaster Integration Setup

## Overview

CommitRemind integrates with Farcaster to send reminder notifications directly to users' Farcaster feeds as interactive Frames.

## Features

- **Frame Notifications**: Reminders appear as interactive Farcaster Frames
- **In-Frame Confirmation**: Users can acknowledge reminders within Farcaster
- **Repeat Notifications**: Notifications sent every 10 minutes during the confirmation window
- **Deep Linking**: Frames link back to the app for on-chain confirmation

## How It Works

### 1. Notification Schedule

- Notifications start **1 hour before** the reminder time
- Repeat every **10 minutes** until confirmation or deadline
- Users have until **1 hour after** reminder time to confirm

### 2. Farcaster Frames

Frames are interactive mini-apps within Farcaster that display:
- Reminder description
- Time information
- Action buttons (Confirm, View Details)

### 3. Notification Flow

\`\`\`
1. User creates reminder with Farcaster account linked
2. Cron job checks every 10 minutes for reminders needing notifications
3. When notification window starts, send Frame to user's Farcaster feed
4. User sees Frame and can interact within Farcaster
5. User clicks "Confirm" → redirected to app for on-chain transaction
6. On-chain confirmation reclaims tokens
\`\`\`

## Implementation

### API Endpoints

- \`/api/frame\` - Main frame endpoint (GET for image, POST for interactions)
- \`/api/frame/confirm\` - Confirmation success frame
- \`/api/notifications/send\` - Cron job endpoint to check and send notifications

### Environment Variables

\`\`\`env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
FARCASTER_API_KEY=your_farcaster_api_key
CRON_SECRET=your_cron_secret_for_vercel
\`\`\`

### Vercel Cron Jobs

The \`vercel.json\` file configures a cron job that runs hourly to check for reminders needing notifications:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/notifications/send",
      "schedule": "0 * * * *"  // Runs at the start of every hour
    }
  ]
}
\`\`\`

**Note:** The current configuration runs hourly to comply with Vercel Hobby plan limits (daily cron maximum). For the full experience with 10-minute notification intervals as originally designed, upgrade to a Vercel Pro plan and change the schedule to `*/10 * * * *`.

## Testing

### 1. Test Frame Locally

Visit: \`http://localhost:3000/api/frame?id=1&desc=Test+reminder\`

### 2. Validate Frame

Use the Farcaster Frame Validator:
https://warpcast.com/~/developers/frames

### 3. Test Notifications

Call the notification endpoint:
\`\`\`bash
curl -X GET http://localhost:3000/api/notifications/send \\
  -H "Authorization: Bearer YOUR_CRON_SECRET"
\`\`\`

## Production Deployment

1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. Configure Farcaster API credentials
4. Test frame validation with Farcaster tools
5. Monitor cron job logs in Vercel dashboard

## Farcaster API Integration

To send actual notifications, integrate with:
- [Neynar API](https://docs.neynar.com/) - Recommended Farcaster API provider
- [Pinata Farcaster API](https://docs.pinata.cloud/farcaster)
- Direct Farcaster Hubs

Replace the mock notification sending in \`FarcasterNotificationService\` with real API calls.

## Frame Best Practices

- Keep descriptions under 100 characters for frames
- Use clear, actionable button text
- Provide visual feedback for all actions
- Include deep links back to your app
- Handle errors gracefully in frames

## Troubleshooting

**Frames not showing:**
- Verify frame image renders at \`/api/frame\`
- Check frame metadata is valid
- Use Farcaster frame validator

**Notifications not sending:**
- Check cron job logs in Vercel
- Verify environment variables are set
- Check Farcaster API credentials
- Ensure blockchain connection is working

**Users not seeing reminders:**
- Verify Farcaster account is linked
- Check notification service logs
- Confirm reminder is in correct time window
