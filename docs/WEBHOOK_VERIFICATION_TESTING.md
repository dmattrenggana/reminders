# 🧪 Webhook Verification Testing Guide

## 📋 Overview

Dokumentasi untuk testing webhook verification flow untuk helper post.

---

## 🔄 Complete Flow

\`\`\`
1. Helper clicks "Help to remind"
   ↓
2. Frontend calls /api/reminders/record?useWebhook=true
   ↓
3. Backend creates pending verification entry
   ↓
4. Returns verification_token to frontend
   ↓
5. Helper posts in Farcaster (mention + keywords)
   ↓
6. Neynar webhook → POST /api/webhooks/neynar-cast
   ↓
7. Webhook verifies cast content
   ↓
8. Marks verification as verified
   ↓
9. Frontend polls /api/verifications/[token]
   ↓
10. Frontend receives verified status → Call recordReminder()
\`\`\`

---

## 🧪 Testing Steps

### **Step 1: Setup Webhook**

\`\`\`bash
# Run setup script
npx tsx scripts/setup-neynar-webhook.ts

# Or setup manually via Neynar Dashboard
# https://neynar.com/dashboard/webhooks
\`\`\`

**Webhook Configuration:**
- **Name:** Reminders Base Verification
- **URL:** `https://remindersbase.vercel.app/api/webhooks/neynar-cast`
- **Subscription:** `cast.created`
- **Pattern:** `(?i)(Tick-tock.*Don't forget your.*https://remindersbase\.vercel\.app/)`

---

### **Step 2: Test Webhook Endpoint (Manual)**

\`\`\`bash
# Test webhook endpoint dengan curl
curl -X POST https://remindersbase.vercel.app/api/webhooks/neynar-cast \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cast.created",
    "data": {
      "hash": "0x123...",
      "text": "Tick-tock, @alice ! ⏰ Don'\''t forget your Finish project is approaching at Dec 25, 2024. Beat the clock! https://remindersbase.vercel.app/",
      "author": {
        "fid": 12345
      },
      "timestamp": "2024-12-24T10:00:00Z",
      "mentioned_profiles": [
        {"fid": 123, "username": "alice"}
      ]
    }
  }'
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "verified": 0,
  "message": "No pending verification found"
}
\`\`\`

---

### **Step 3: Create Pending Verification**

\`\`\`bash
# Call record API dengan useWebhook=true
curl -X POST https://remindersbase.vercel.app/api/reminders/record \
  -H "Content-Type: application/json" \
  -d '{
    "reminderId": 1,
    "helperAddress": "0x123...",
    "helperFid": 12345,
    "creatorUsername": "alice",
    "useWebhook": true
  }'
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "verification_token": "uuid-here",
  "status": "pending",
  "message": "Pending verification created. Waiting for webhook notification..."
}
\`\`\`

---

### **Step 4: Test Webhook dengan Pending Verification**

Setelah create pending verification, test webhook lagi dengan FID yang sama:

\`\`\`bash
curl -X POST https://remindersbase.vercel.app/api/webhooks/neynar-cast \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cast.created",
    "data": {
      "hash": "0x456...",
      "text": "Tick-tock, @alice ! ⏰ Don'\''t forget your Finish project is approaching at Dec 25, 2024. Beat the clock! https://remindersbase.vercel.app/",
      "author": {
        "fid": 12345
      },
      "timestamp": "2024-12-24T10:05:00Z",
      "mentioned_profiles": [
        {"fid": 123, "username": "alice"}
      ]
    }
  }'
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "verified": 1,
  "message": "Processed webhook, verified 1 pending verification(s)"
}
\`\`\`

---

### **Step 5: Check Verification Status**

\`\`\`bash
# Poll verification status
curl https://remindersbase.vercel.app/api/verifications/[token]
\`\`\`

**Expected Response (if verified):**
\`\`\`json
{
  "status": "verified",
  "reminderId": 1,
  "helperFid": 12345,
  "createdAt": "2024-12-24T10:00:00.000Z",
  "expiresAt": "2024-12-24T10:10:00.000Z",
  "verifiedAt": "2024-12-24T10:05:00.000Z",
  "neynarScore": 0.85,
  "estimatedReward": "0.123"
}
\`\`\`

---

## ✅ Verification Criteria

Webhook akan verify cast jika:

1. ✅ **Author FID matches** pending verification's helper FID
2. ✅ **Cast mentions creator** (`@creatorUsername`)
3. ✅ **Cast contains reminder keywords:**
   - `Tick-tock`
   - `Don't forget`
   - `Beat the clock`
   - `approaching`
   - `remindersbase.vercel.app` (app URL)
4. ✅ **Cast is recent** (within last 10 minutes)

---

## 🔍 Debugging

### **Check Logs:**

\`\`\`bash
# Application logs should show:
[Webhook] Received Neynar webhook: { type: 'cast.created', ... }
[Webhook] Processing cast: { hash: '...', authorFid: 12345, ... }
[Webhook] ✅ Cast matches verification requirements for reminder 1
[Webhook] ✅ Successfully verified reminder 1 for helper FID 12345
\`\`\`

### **Common Issues:**

1. **No pending verification found**
   - Check if pending verification was created
   - Check if helper FID matches
   - Check if verification expired (10 minutes TTL)

2. **Cast doesn't match requirements**
   - Check if cast mentions creator
   - Check if cast contains keywords
   - Check if cast is recent (within 10 minutes)

3. **Webhook not received**
   - Check Neynar Dashboard → Webhooks → Logs
   - Verify webhook URL is accessible
   - Check webhook subscription pattern

---

## 📝 Test Checklist

- [ ] Webhook endpoint accessible (200 OK)
- [ ] Create pending verification works
- [ ] Webhook receives cast.created events
- [ ] Verification matches cast content correctly
- [ ] Verification status API returns correct status
- [ ] Expired verifications are handled correctly
- [ ] Error handling works (missing data, API errors)
