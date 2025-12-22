# Auto-Claim Flow Implementation

## Overview
Implementasi otomatis untuk flow "Help Remind Me" yang memungkinkan helpers mendapatkan reward dengan proses yang seamless.

## Flow Diagram

\`\`\`
[User clicks "Help Remind Me"] 
    ↓
[Opens Warpcast Compose dengan callback URL]
    ↓
[User posts mention to creator]
    ↓
[Warpcast redirects back dengan ?claim=X&helper=Y&fid=Z]
    ↓
[App detects callback parameters]
    ↓
[Call /api/reminders/record untuk get Neynar score]
    ↓
[Add to pending claims (local storage)]
    ↓
[AUTO: Request transaction untuk recordReminder()]
    ↓
[AUTO: Request transaction untuk claimReward()]
    ↓
[Success: Remove from pending claims]
    ↓
[Failed: Increment retry count, show pada reload]
\`\`\`

## Key Features

### 1. **Auto-Redirect dari Warpcast**
- Callback URL disisipkan sebagai embed di Warpcast post
- Format: `{appUrl}?claim={reminderId}&helper={address}&fid={fid}`
- Miniapp auto-redirect kembali ke app setelah post

### 2. **Auto-Claim Transaction**
- Tidak perlu manual klik button
- Transaction request langsung muncul setelah redirect
- 2 transactions berurutan:
  1. `recordReminder(reminderId, neynarScore)` - Record bahwa user sudah help
  2. `claimReward(reminderId)` - Claim reward sesuai tier

### 3. **Retry Mechanism**
- Pending claims disimpan di localStorage
- Jika transaksi gagal, akan retry saat reload app
- Maximum 3 retries
- Claims expire setelah 24 jam

### 4. **Neynar Score Calculation**
- Power Badge users: 0.95 (high tier)
- Regular users: Logarithmic scale based on follower count
  - 100 followers ≈ 0.4
  - 1,000 followers ≈ 0.6
  - 10,000 followers ≈ 0.8

### 5. **Reward Tiers**
- **≥ 0.9**: 10% dari reward pool
- **0.5 - 0.89**: 6% dari reward pool
- **< 0.5**: 3% dari reward pool

## Files Modified/Created

### New Files
1. **`lib/utils/pending-claims.ts`**
   - Manages pending claims in localStorage
   - Functions: addPendingClaim, getPendingClaims, removePendingClaim, incrementRetry

### Modified Files

1. **`components/dashboard-client.tsx`**
   - Added callback detection useEffect
   - Added pending claims check useEffect
   - Added auto-claim transaction useEffect
   - Updated handleHelpRemindMe to include callback URL

2. **`app/api/reminders/record/route.ts`**
   - Validates helper hasn't already helped
   - Fetches Neynar score from API
   - Calculates estimated reward
   - Returns data for frontend to initiate claim

3. **`app/api/neynar/score/route.ts`**
   - Fixed score calculation (was using follower_count * 10)
   - Now uses proper 0-1 normalized score
   - Power badge = 0.95
   - Regular = logarithmic based on followers

## API Endpoints

### POST `/api/reminders/record`
**Request:**
\`\`\`json
{
  "reminderId": 123,
  "helperAddress": "0x...",
  "helperFid": 12345
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "reminderId": 123,
    "neynarScore": 0.85,
    "estimatedReward": "5.2500",
    "rewardPercentage": "6%",
    "user": {
      "username": "helper",
      "pfp": "https://...",
      "fid": 12345
    },
    "shouldClaim": true
  }
}
\`\`\`

### GET `/api/neynar/score?fid=123`
**Response:**
\`\`\`json
{
  "score": 0.85,
  "rawScore": 0.847,
  "user": {
    "fid": 123,
    "username": "user",
    "pfp": "https://...",
    "followerCount": 1234,
    "powerBadge": false
  }
}
\`\`\`

## Smart Contract Functions

### `recordReminder(uint256 reminderId, uint256 neynarScore)`
- Records that helper has helped with this reminder
- Stores Neynar score (passed as integer 0-100)
- Emits `UserReminded` event

### `claimReward(uint256 reminderId)`
- Calculates reward based on stored Neynar score
- Transfers tokens from reward pool to helper
- Updates total rewards claimed
- Emits `RewardClaimed` event

## User Experience

### Happy Path
1. ✅ User sees "Help Remind Me" button (only enabled at T-1 hour)
2. ✅ Clicks button → Opens Warpcast with pre-filled mention
3. ✅ Posts mention → Auto redirects back to miniapp
4. ✅ Transaction request appears automatically
5. ✅ Confirms transaction → Reward claimed!
6. ✅ See success message with amount earned

### Error Handling
1. ❌ Transaction fails/rejected
2. 💾 Claim saved to pending (localStorage)
3. 🔄 Next reload: Auto-show transaction request again
4. 📊 Maximum 3 retries over 24 hours
5. ⏰ After 24 hours: Claim expires

## Testing Checklist

### Frontend
- [ ] "Help Remind Me" button disabled ketika belum T-1 hour
- [ ] Button enabled dan clickable saat T-1 hour
- [ ] Warpcast opens dengan correct mention text
- [ ] Callback URL detection works
- [ ] Pending claims persisted di localStorage
- [ ] Auto-transaction request triggered
- [ ] Success: Claim removed from pending
- [ ] Failure: Retry counter increments
- [ ] Reload: Pending claim auto-triggered

### Backend
- [ ] /api/reminders/record validates inputs
- [ ] Neynar API fetches user data correctly
- [ ] Score calculation accurate
- [ ] Duplicate check works (already helped)
- [ ] Estimated reward calculation correct
- [ ] Error responses handled properly

### Contract
- [ ] recordReminder stores data correctly
- [ ] claimReward calculates correct amount
- [ ] Reward tiers match specification
- [ ] Events emitted properly
- [ ] Can't claim twice for same reminder
- [ ] Reward pool balance updates correctly

## Environment Variables Required

\`\`\`env
# Neynar API
NEYNAR_API_KEY=your_neynar_api_key

# Contract Addresses (already configured)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6EE85c2cfAB33678DE10A5E1634D86ABB5EeBB07
NEXT_PUBLIC_VAULT_CONTRACT=0xAE774199149c906A0B8bFDc87a1Dd80ca274cEa6

# RPC
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
\`\`\`

## Known Limitations

1. **localStorage dependency**: Pending claims only work on same browser/device
2. **No backend tracking**: Jika user clears browser data, pending claims hilang
3. **No notification**: User harus manual reload untuk retry failed claims
4. **Single retry at a time**: Hanya 1 pending claim processed per reload

## Future Improvements

1. **Backend Pending Queue**: Store pending claims di database instead of localStorage
2. **Push Notifications**: Notify user untuk retry failed claims
3. **Batch Claiming**: Allow claiming multiple rewards sekaligus
4. **Claim History**: Show history of claimed rewards
5. **Auto-refresh**: Polling untuk auto-retry tanpa reload
6. **Web3 Wallet Detection**: Fallback jika wallet not connected

## Security Considerations

1. ✅ Validate wallet address matches helper address
2. ✅ Check helper hasn't already claimed
3. ✅ Verify Neynar score dari official API
4. ✅ Smart contract enforces reward limits
5. ✅ No sensitive data in URL parameters
6. ✅ Transaction signed by user wallet (no backend keys)

---

**Status**: ✅ Implemented and ready for testing  
**Last Updated**: Dec 22, 2025  
**Author**: AI Assistant
