# 🔗 Webhook Verification Setup untuk Helper Post

## 📋 Overview

Mengganti **polling mechanism** dengan **webhook-based verification** akan membuat sistem lebih efisien dan real-time. Dengan webhook, sistem akan menerima notifikasi langsung ketika helper melakukan post di Farcaster, tanpa perlu polling setiap detik.

---

## 🔄 Perbandingan: Polling vs Webhook

### **Current: Polling (Inefficient)**

**Cara Kerja:**
- Frontend polling API setiap 1 detik
- Durasi: 2 menit (120 API calls)
- Wasted calls jika helper belum post

**Masalah:**
- ❌ Banyak API calls yang tidak perlu
- ❌ Delay detection (bisa sampai 1 detik)
- ❌ Consume quota/rate limits
- ❌ Server load tinggi

### **Proposed: Webhook (Efficient)**

**Cara Kerja:**
- Farcaster/Neynar mengirim webhook ketika cast baru dibuat
- Backend menerima webhook langsung
- Instant notification, no polling needed

**Keuntungan:**
- ✅ Instant notification (real-time)
- ✅ Tidak ada wasted API calls
- ✅ Lebih efisien (hanya trigger saat ada event)
- ✅ Mengurangi server load

---

## 🎯 Opsi Webhook yang Tersedia

### **Opsi 1: Farcaster Hub Events (Recommended)**

Farcaster Hub menyediakan event stream untuk casts baru.

**Documentation:**
- Farcaster Hub Events: https://github.com/farcasterxyz/hub-monorepo
- Hub gRPC API untuk subscribe events

**Requirements:**
1. Farcaster Hub node (self-hosted atau use public hub)
2. gRPC client untuk subscribe events
3. WebSocket connection untuk real-time events

**Events yang relevan:**
- `CastAdd` - ketika user membuat cast baru
- Filter by `fid` (helper FID) dan check content

**Kompleksitas:** ⚠️ **Medium-High**
- Perlu setup Hub node atau connect ke public hub
- Perlu handle gRPC/WebSocket connections
- Perlu filter dan process events

---

### **Opsi 2: Neynar Webhook API**

Neynar menyediakan webhook untuk berbagai events.

**Documentation:**
- Neynar API Docs: https://docs.neynar.com/docs
- Webhook events untuk casts

**Requirements:**
1. Neynar API key dengan webhook access
2. Public webhook endpoint (HTTPS required)
3. Webhook signature verification

**Events yang relevan:**
- Cast created events
- Filter by user FID

**Kompleksitas:** ⚠️ **Medium**
- Perlu setup public webhook endpoint
- Perlu handle webhook signature verification
- Perlu database untuk track pending verifications

**Status:** ⚠️ Perlu verifikasi apakah Neynar menyediakan webhook untuk casts (belum konfirmasi dari docs)

---

### **Opsi 3: Custom Webhook Service (Hybrid)**

Menggunakan service pihak ketiga atau membuat custom webhook listener.

**Opsi 3a: Farcaster Frame Backend (Self-Hosted)**

**Requirements:**
1. Backend service yang subscribe ke Farcaster Hub events
2. Webhook endpoint untuk receive events
3. Database untuk store pending verifications

**Implementation:**
\`\`\`typescript
// Backend service (Node.js/Express)
import { HubClient } from '@farcaster/hub-nodejs';

const hubClient = new HubClient({
  // Connect to Farcaster Hub
});

// Subscribe to cast events
hubClient.subscribe({
  eventTypes: ['cast.add'],
  fromId: 0,
}).on('event', async (event) => {
  if (event.castAddEvent) {
    const cast = event.castAddEvent.cast;
    // Check if this is a helper post for our reminders
    // Send webhook to our API
  }
});
\`\`\`

**Kompleksitas:** ⚠️ **High**
- Perlu maintain separate backend service
- Perlu handle Hub connection
- Perlu filter dan route events

---

### **Opsi 4: Warpcast API Webhook (Jika Tersedia)**

Warpcast mungkin menyediakan webhook untuk casts (perlu verifikasi).

**Requirements:**
1. Warpcast API access (jika tersedia)
2. Webhook endpoint
3. Authentication

**Kompleksitas:** ⚠️ **Unknown** (perlu research lebih lanjut)

---

## 📋 Requirements untuk Implementasi Webhook

### **1. Public Webhook Endpoint (HTTPS)**

**Why:**
- Farcaster/Neynar perlu mengirim POST request ke endpoint Anda
- Harus accessible dari internet (public URL)
- Harus HTTPS (security requirement)

**Options:**
- ✅ Vercel API Routes (sudah HTTPS, public)
- ✅ Railway/Render backend service
- ✅ AWS Lambda + API Gateway
- ❌ Localhost (tidak bisa digunakan)

**Example Endpoint:**
\`\`\`
POST https://remindersbase.vercel.app/api/webhooks/farcaster-cast
\`\`\`

---

### **2. Webhook Signature Verification**

**Why:**
- Untuk memastikan webhook benar-benar dari Farcaster/Neynar
- Prevent webhook spoofing/attacks
- Security best practice

**How:**
- Farcaster/Neynar akan sign webhook dengan secret key
- Backend verify signature menggunakan shared secret
- Reject jika signature tidak valid

**Example:**
\`\`\`typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
\`\`\`

---

### **3. Database untuk Pending Verifications**

**Why:**
- Store helper's pending verification requests
- Match incoming webhooks dengan pending requests
- Track verification status

**Schema:**
\`\`\`sql
CREATE TABLE pending_verifications (
  id UUID PRIMARY KEY,
  reminder_id INTEGER NOT NULL,
  helper_fid INTEGER NOT NULL,
  helper_address TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- e.g., 10 minutes from created_at
  status TEXT DEFAULT 'pending', -- pending, verified, expired
  verified_at TIMESTAMP,
  webhook_received_at TIMESTAMP
);
\`\`\`

**Alternatives:**
- Redis (untuk temporary storage, TTL)
- In-memory cache (untuk development, tidak persistent)
- PostgreSQL/MySQL (untuk production)

---

### **4. Webhook Event Processing**

**Process Flow:**
\`\`\`
1. Webhook received → Verify signature
2. Extract cast data (fid, text, timestamp)
3. Query pending_verifications table
4. Match dengan pending request
5. Verify post content (mention + keywords)
6. Update status to 'verified'
7. Notify frontend (via WebSocket/SSE/polling fallback)
\`\`\`

---

### **5. Frontend Integration**

**Options untuk notify frontend:**

**Option A: WebSocket Connection**
- Frontend connect ke WebSocket server
- Backend push notification ketika verification complete
- Real-time, efficient

**Option B: Server-Sent Events (SSE)**
- Frontend subscribe ke SSE endpoint
- Backend stream events
- Simpler than WebSocket, one-way only

**Option C: Polling Fallback (Hybrid)**
- Start dengan webhook
- Jika webhook tidak datang dalam X menit, fallback ke polling
- Best of both worlds

---

## 🏗️ Architecture Proposal

### **Hybrid Approach (Recommended)**

Kombinasi webhook + polling fallback:

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 1. Helper clicks "Help to remind"                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls /api/reminders/record                    │
│    - Creates pending_verification entry                    │
│    - Returns verification_token                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Helper posts in Farcaster                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4a. WEBHOOK PATH (Preferred)                               │
│     Farcaster → Webhook → Verify → Update DB               │
│                                                             │
│ 4b. POLLING FALLBACK (If webhook timeout)                  │
│     Frontend polls /api/verifications/{token}              │
│     Check status from DB                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend receives notification (WebSocket/SSE/polling)  │
│    → Call recordReminder() contract                        │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📝 Implementation Steps

### **Step 1: Setup Webhook Endpoint**

**File:** `app/api/webhooks/farcaster-cast/route.ts`

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/utils/webhook-verification';
import { db } from '@/lib/db'; // Your database client

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-farcaster-signature');
    
    // 2. Verify signature
    const isValid = verifyWebhookSignature(
      rawBody,
      signature || '',
      process.env.FARCASTER_WEBHOOK_SECRET || ''
    );
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // 3. Parse webhook payload
    const event = JSON.parse(rawBody);
    
    // 4. Process cast event
    if (event.type === 'cast.add') {
      const { fid, text, timestamp } = event.data;
      
      // 5. Check if this matches any pending verification
      const pendingVerification = await db.pendingVerifications.findFirst({
        where: {
          helper_fid: fid,
          status: 'pending',
          expires_at: { gt: new Date() },
        },
      });
      
      if (pendingVerification) {
        // 6. Verify post content
        const isVerified = verifyPostContent(
          text,
          pendingVerification.creator_username
        );
        
        if (isVerified) {
          // 7. Update status
          await db.pendingVerifications.update({
            where: { id: pendingVerification.id },
            data: {
              status: 'verified',
              verified_at: new Date(),
              webhook_received_at: new Date(),
            },
          });
          
          // 8. Notify frontend (via WebSocket/SSE/polling)
          await notifyFrontend(pendingVerification.id);
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function verifyPostContent(text: string, creatorUsername: string): boolean {
  const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
  const reminderPattern = new RegExp(
    `remindersbase\\.vercel\\.app|Tick-tock|Beat the clock|approaching`,
    'i'
  );
  
  return mentionPattern.test(text) && reminderPattern.test(text);
}
\`\`\`

---

### **Step 2: Modify Record API untuk Create Pending Verification**

**File:** `app/api/reminders/record/route.ts`

\`\`\`typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId, helperAddress, helperFid, creatorUsername } = body;

    // Create pending verification entry
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.pendingVerifications.create({
      data: {
        id: verificationToken,
        reminder_id: reminderId,
        helper_fid: helperFid,
        helper_address: helperAddress,
        creator_username: creatorUsername,
        expires_at: expiresAt,
        status: 'pending',
      },
    });

    // Return token untuk frontend polling fallback
    return NextResponse.json({
      success: true,
      verification_token: verificationToken,
      message: 'Pending verification created. Waiting for webhook...',
    });
  } catch (error) {
    // ... error handling
  }
}
\`\`\`

---

### **Step 3: Create Verification Status API**

**File:** `app/api/verifications/[token]/route.ts`

\`\`\`typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const verification = await db.pendingVerifications.findUnique({
    where: { id: params.token },
  });

  if (!verification) {
    return NextResponse.json(
      { error: 'Verification not found' },
      { status: 404 }
    );
  }

  // Check if expired
  if (verification.expires_at < new Date() && verification.status === 'pending') {
    await db.pendingVerifications.update({
      where: { id: params.token },
      data: { status: 'expired' },
    });
  }

  return NextResponse.json({
    status: verification.status,
    verified_at: verification.verified_at,
    // Include neynar score if verified
    ...(verification.status === 'verified' && {
      neynar_score: verification.neynar_score,
      estimated_reward: verification.estimated_reward,
    }),
  });
}
\`\`\`

---

### **Step 4: Setup Webhook Subscription**

**File:** `lib/webhooks/farcaster-subscriber.ts`

\`\`\`typescript
// Service untuk subscribe ke Farcaster Hub events
// Run sebagai background service atau serverless function

import { HubClient } from '@farcaster/hub-nodejs';

export async function subscribeToCastEvents() {
  const hubClient = new HubClient({
    hubUrl: process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz',
  });

  // Subscribe to cast.add events
  hubClient.subscribe({
    eventTypes: ['cast.add'],
    fromId: 0, // Start from beginning, or use cursor for incremental
  }).on('event', async (event) => {
    if (event.castAddEvent) {
      const cast = event.castAddEvent.cast;
      
      // Forward to webhook endpoint
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/farcaster-cast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-farcaster-signature': generateSignature(JSON.stringify(cast)),
        },
        body: JSON.stringify({
          type: 'cast.add',
          data: {
            fid: cast.fid,
            text: cast.text,
            timestamp: cast.timestamp,
          },
        }),
      });
    }
  });
}
\`\`\`

---

### **Step 5: Frontend Integration**

**File:** `hooks/use-reminder-actions.ts` (modify `helpRemind`)

\`\`\`typescript
const helpRemind = async (reminder: any, isMiniApp: boolean, fid: number) => {
  // ... existing code untuk open composer ...

  // Step: Create pending verification
  const response = await fetch("/api/reminders/record", {
    method: "POST",
    body: JSON.stringify({
      reminderId: reminder.id,
      helperAddress: address,
      helperFid: fid,
      creatorUsername: creatorUsername,
    }),
  });

  const { verification_token } = await response.json();

  // Option A: WebSocket connection
  const ws = new WebSocket(`wss://remindersbase.vercel.app/ws/verification/${verification_token}`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.status === 'verified') {
      // Proceed to recordReminder
      proceedToRecordReminder(data);
    }
  };

  // Option B: Polling fallback (simpler, no WebSocket needed)
  const pollStatus = async () => {
    const statusResponse = await fetch(`/api/verifications/${verification_token}`);
    const status = await statusResponse.json();
    
    if (status.status === 'verified') {
      // Proceed to recordReminder
      proceedToRecordReminder(status);
    } else if (status.status === 'pending') {
      // Continue polling (with timeout)
      setTimeout(pollStatus, 2000); // Poll every 2 seconds
    } else {
      // Expired or error
      throw new Error('Verification expired');
    }
  };

  // Start polling (or WebSocket)
  pollStatus();
};
\`\`\`

---

## 🔐 Security Considerations

### **1. Webhook Signature Verification**

**Critical:** Selalu verify signature sebelum process webhook.

\`\`\`typescript
// Never trust webhook without signature verification!
if (!verifyWebhookSignature(payload, signature, secret)) {
  return 401; // Unauthorized
}
\`\`\`

### **2. Rate Limiting**

**Protect webhook endpoint dari abuse:**
- Rate limit per IP
- Rate limit per FID
- Monitor suspicious patterns

### **3. Input Validation**

**Validate semua input dari webhook:**
- Sanitize text content
- Validate FID format
- Check timestamp range

### **4. Database Security**

**Protect pending verifications:**
- Encrypt sensitive data
- Set expiration TTL
- Clean up expired entries

---

## 📊 Infrastructure Requirements

### **Database**

**Options:**
- ✅ **Vercel Postgres** (easy integration dengan Vercel)
- ✅ **Supabase** (PostgreSQL with real-time features)
- ✅ **PlanetScale** (MySQL, serverless)
- ✅ **Redis** (untuk temporary storage, fast)

### **WebSocket/SSE Server**

**Options:**
- ✅ **Vercel Serverless Functions** (tidak support WebSocket, perlu SSE)
- ✅ **Railway/Render** (support WebSocket)
- ✅ **Socket.io** (self-hosted)
- ✅ **Pusher/Ably** (managed service)

### **Background Service (Optional)**

Jika menggunakan Farcaster Hub events:

- ✅ **Railway/Render** (background worker)
- ✅ **AWS Lambda** (serverless function)
- ✅ **Vercel Cron** (periodic check, bukan real-time)

---

## 🎯 Recommended Approach

### **Phase 1: Simple Webhook + Polling Hybrid**

**Best for MVP:**
1. Setup webhook endpoint (Vercel API Route)
2. Use database (Vercel Postgres) untuk pending verifications
3. Frontend polling fallback (simpler than WebSocket)
4. Manual webhook trigger untuk testing (simulate Farcaster events)

**Kompleksitas:** ⭐⭐ Low-Medium

---

### **Phase 2: Full Webhook Integration**

**Best for Production:**
1. Subscribe to Farcaster Hub events (via background service)
2. Real-time webhook processing
3. WebSocket/SSE untuk frontend notifications
4. Complete automation

**Kompleksitas:** ⭐⭐⭐⭐ High

---

## 📋 Checklist Implementation

### **Minimum Requirements:**
- [ ] Public HTTPS webhook endpoint
- [ ] Database untuk pending verifications
- [ ] Webhook signature verification
- [ ] Frontend polling fallback
- [ ] Error handling & logging

### **Optional (Phase 2):**
- [ ] Farcaster Hub event subscription
- [ ] WebSocket/SSE server
- [ ] Background worker service
- [ ] Real-time notifications

---

## 🚀 Next Steps

1. **Research:** Verifikasi apakah Neynar/Farcaster menyediakan webhook API
2. **Design:** Pilih approach (simple hybrid vs full webhook)
3. **Setup:** Database untuk pending verifications
4. **Implement:** Webhook endpoint + verification logic
5. **Test:** Manual webhook testing dengan curl/Postman
6. **Deploy:** Production webhook endpoint
7. **Monitor:** Webhook delivery & error rates

---

## 📚 References

- Farcaster Hub: https://github.com/farcasterxyz/hub-monorepo
- Neynar API Docs: https://docs.neynar.com/docs
- Webhook Security: https://webhooks.fyi/
- Vercel Webhooks: https://vercel.com/docs/observability/webhooks
