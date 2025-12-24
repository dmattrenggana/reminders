# 🔗 Neynar Webhook Setup Guide

## 📋 Overview

Implementasi webhook untuk verifikasi helper post menggunakan Neynar `publishWebhook` API. Webhook ini akan menerima notifikasi real-time ketika helper membuat cast yang sesuai dengan criteria.

---

## 🏗️ Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 1. Helper clicks "Help to remind"                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls /api/reminders/record?useWebhook=true    │
│    Creates pending verification entry                      │
│    Returns verification_token                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Helper posts in Farcaster (mention + keywords)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ✅ NEYNAR WEBHOOK                                        │
│    Neynar → POST /api/webhooks/neynar-cast                │
│    - Verify cast content                                   │
│    - Match dengan pending verification                     │
│    - Mark as verified                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend polls /api/verifications/[token]               │
│    (fallback if webhook delay)                             │
│    Get status: verified                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend receives verified status → Call recordReminder()│
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📝 Setup Instructions

### **Step 1: Setup Webhook di Neynar**

#### **Option A: Using Setup Script (Recommended)**

\`\`\`bash
# Install dependencies if needed
npm install dotenv tsx

# Run setup script
npx tsx scripts/setup-neynar-webhook.ts
\`\`\`

#### **Option B: Manual Setup via Dashboard**

1. Login ke Neynar Dashboard: https://neynar.com/dashboard
2. Navigate ke **Webhooks** section
3. Create new webhook:
   - **Name:** `Reminders Base Verification`
   - **URL:** `https://remindersbase.vercel.app/api/webhooks/neynar-cast`
   - **Subscription:**
     \`\`\`json
     {
       "cast.created": {
         "text": "(?i)(Tick-tock|Don't forget|Beat the clock|approaching|remindersbase\\.vercel\\.app)"
       }
     }
     \`\`\`

---

### **Step 2: Environment Variables**

Pastikan environment variables sudah di-set:

\`\`\`env
NEYNAR_API_KEY=your_neynar_api_key_here
NEYNAR_WEBHOOK_URL=https://remindersbase.vercel.app/api/webhooks/neynar-cast
\`\`\`

---

### **Step 3: Test Webhook**

1. Create test cast di Farcaster dengan content:
   \`\`\`
   Tick-tock, @creator ! ⏰ Don't forget your reminder is approaching at Dec 25, 2024. Beat the clock! https://remindersbase.vercel.app/
   \`\`\`

2. Check application logs untuk webhook events

3. Verify webhook received di Neynar Dashboard

---

## 🔧 Implementation Details

### **Files Created:**

1. **`app/api/webhooks/neynar-cast/route.ts`**
   - Webhook endpoint untuk receive Neynar events
   - Verify cast content
   - Match dengan pending verifications
   - Mark as verified

2. **`lib/utils/pending-verifications.ts`**
   - In-memory storage untuk pending verifications
   - Map-based storage dengan TTL cleanup
   - Functions untuk CRUD operations

3. **`app/api/verifications/[token]/route.ts`**
   - Get verification status by token
   - Used by frontend untuk polling (fallback)

4. **`scripts/setup-neynar-webhook.ts`**
   - Script untuk setup webhook di Neynar
   - Uses Neynar SDK `publishWebhook`

### **Modified Files:**

1. **`app/api/reminders/record/route.ts`**
   - Added `useWebhook` parameter support
   - Create pending verification jika `useWebhook=true`
   - Return verification_token untuk frontend polling

---

## 🔄 Usage

### **Frontend: Enable Webhook Mode**

\`\`\`typescript
// In hooks/use-reminder-actions.ts
const response = await fetch("/api/reminders/record", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reminderId: reminder.id,
    helperAddress: address,
    helperFid: fid,
    creatorUsername: creatorUsername,
    useWebhook: true, // Enable webhook mode
  }),
});

const { verification_token } = await response.json();

// Poll verification status
const pollStatus = async () => {
  const statusResponse = await fetch(`/api/verifications/${verification_token}`);
  const status = await statusResponse.json();
  
  if (status.status === 'verified') {
    // Proceed to recordReminder
    proceedToRecordReminder(status);
  } else if (status.status === 'pending') {
    // Continue polling
    setTimeout(pollStatus, 2000);
  }
};

pollStatus();
\`\`\`

---

## 🔐 Security

### **Webhook Signature Verification**

**Status:** ⚠️ Not implemented yet (Neynar webhook signature verification)

**Todo:**
- Add signature verification jika Neynar menyediakan
- Verify webhook berasal dari Neynar
- Prevent webhook spoofing

**Current:** Webhook endpoint is public, rely on Neynar's IP whitelist (if available)

---

## 📊 Storage

### **In-Memory Map Storage**

- **Pros:**
  - Fast (no database needed)
  - Simple setup
  - Good untuk MVP

- **Cons:**
  - Not persistent (lost on server restart)
  - Not scalable (single server only)
  - No shared state across instances

### **Migration to Database (Future)**

Untuk production, consider migrating ke database:

- **Vercel Postgres** (recommended)
- **Supabase** (PostgreSQL)
- **Redis** (fast, temporary storage)

---

## 🐛 Troubleshooting

### **Webhook Not Received**

1. Check Neynar Dashboard → Webhooks → Logs
2. Verify webhook URL is accessible (HTTPS required)
3. Check application logs for errors
4. Verify webhook subscription criteria matches your casts

### **Pending Verification Not Found**

1. Check if verification expired (10 minutes TTL)
2. Verify helper FID matches
3. Check if cast content matches criteria
4. Review application logs

### **Webhook Signature Verification Failed**

- If implemented, check signature secret key
- Verify request headers
- Check Neynar documentation for signature format

---

## 📚 References

- Neynar Webhook Docs: https://docs.neynar.com/docs
- Neynar SDK: https://github.com/neynarxyz/neynar-nodejs-sdk
- Webhook Best Practices: https://webhooks.fyi/

---

## ✅ Checklist

- [ ] Neynar API key configured
- [ ] Webhook URL accessible (HTTPS)
- [ ] Webhook created di Neynar Dashboard
- [ ] Test webhook dengan test cast
- [ ] Frontend integration (optional, can use polling mode)
- [ ] Monitor webhook logs
- [ ] Error handling tested
