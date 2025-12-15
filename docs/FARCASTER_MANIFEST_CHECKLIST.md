# Farcaster Manifest Configuration Checklist

## Required Steps

### 1. Update Icon and Splash Images
- **Icon**: Must be 1024x1024px PNG with NO alpha channel
  - Location: `public/icon.png`
  - Test: Open in image editor and verify no transparency
  
- **Splash**: Should be 200x200px (but 1024x1024 works too)
  - Location: `public/splash.png`
  - Background color in manifest: `#0f172a`

### 2. Get Account Association from Warpcast
1. Go to: https://warpcast.com/~/developers/miniapps
2. Register your miniapp with domain: `remindersbase.vercel.app`
3. Copy the `accountAssociation` object (header, payload, signature)
4. Replace the placeholder in `public/.well-known/farcaster.json`

### 3. Verify Manifest
- Visit: `https://remindersbase.vercel.app/.well-known/farcaster.json`
- Should return valid JSON with no errors
- All URLs should be HTTPS and publicly accessible

### 4. Test the Miniapp
1. Share your app URL in Warpcast
2. Click the button to launch the miniapp
3. Splash screen should dismiss after 1-2 seconds
4. App should load and show the dashboard preview

## Common Issues

### Stuck on Splash Screen
- Ensure `sdk.actions.ready()` is called without await
- Check that all images are accessible (200 status code)
- Verify manifest has correct format

### Cannot Convert Object to Primitive Value
- Don't log SDK objects directly (use JSON.stringify or specific properties only)
- Don't access nested SDK properties in template literals

### Auto-connect Fails
- This is expected if SDK context isn't available immediately
- Users can manually click Connect button
- Make sure Neynar API is configured for fallback wallet lookup
</markdown>
