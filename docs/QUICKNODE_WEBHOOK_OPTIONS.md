# ⚡ QuickNode Webhooks untuk Verifikasi Helper Post

## 📋 Quick Answer

**❌ QuickNode webhooks TIDAK bisa digunakan secara langsung untuk verifikasi Farcaster casts**

**✅ TAPI QuickNode webhooks BISA digunakan untuk:**
- Monitor contract events (seperti `recordReminder` transaction)
- Get real-time notifications ketika helper call contract functions
- Track on-chain activity related to reminders

---

## 🔍 Penjelasan Detail

### **QuickNode Webhooks: What They Do**

QuickNode webhooks dirancang untuk **blockchain events**, bukan **social media events**:

**Supported Events:**
- ✅ Transaction events (on-chain)
- ✅ Smart contract events (emitted events)
- ✅ Token transfers
- ✅ Block events
- ❌ **TIDAK support:** Farcaster casts, social posts, off-chain data

**Untuk Farcaster casts (social events), kita perlu:**
- Farcaster Hub events (cast.add)
- Neynar API webhooks (jika tersedia)
- Atau polling Neynar API (current approach)

---

## 💡 Opsi Penggunaan QuickNode Webhooks

### **Opsi 1: Monitor `recordReminder` Contract Events**

**Use Case:** Get notification ketika helper sudah call `recordReminder()` on-chain

**Benefits:**
- Real-time notification ketika transaction confirmed
- Tidak perlu polling untuk check transaction status
- Dapat digunakan sebagai **confirmation** bahwa helper sudah record reminder

**Implementation:**

#### **Step 1: Setup QuickNode Webhook**

1. Login ke QuickNode Dashboard
2. Navigate ke **Webhooks** atau **QuickAlerts**
3. Create new webhook
4. Select **Base Mainnet**
5. Configure filter:
   - **Event Type:** Smart Contract Event
   - **Contract Address:** `0x2e3A524912636BF456B3C19f88693087c4dAa25f` (ReminderVault)
   - **Event Signature:** `RecordReminder(uint256,uint256)` (check contract ABI untuk exact signature)
   - **Destination URL:** `https://remindersbase.vercel.app/api/webhooks/quicknode-record`

#### **Step 2: Create Webhook Endpoint**

**File:** `app/api/webhooks/quicknode-record/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickNodeWebhook } from '@/lib/utils/quicknode-webhook-verification';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature (QuickNode signs webhooks)
    const signature = request.headers.get('x-qn-signature');
    const rawBody = await request.text();
    
    const isValid = verifyQuickNodeWebhook(
      rawBody,
      signature || '',
      process.env.QUICKNODE_WEBHOOK_SECRET || ''
    );
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // 2. Parse webhook payload
    const event = JSON.parse(rawBody);
    
    // 3. Extract event data
    if (event.event?.eventName === 'RecordReminder') {
      const reminderId = event.event.returnValues.reminderId;
      const neynarScore = event.event.returnValues.neynarScore;
      const helperAddress = event.event.returnValues.helperAddress;
      const transactionHash = event.event.transactionHash;
      const blockNumber = event.event.blockNumber;
      
      // 4. Update database: Mark verification as recorded on-chain
      await db.pendingVerifications.updateMany({
        where: {
          reminder_id: reminderId,
          helper_address: helperAddress.toLowerCase(),
          status: 'verified', // Already verified via Neynar API
        },
        data: {
          on_chain_recorded: true,
          on_chain_tx_hash: transactionHash,
          on_chain_block_number: blockNumber,
          recorded_at: new Date(),
        },
      });
      
      // 5. Optional: Notify frontend via WebSocket/SSE
      await notifyFrontend({
        reminderId,
        helperAddress,
        txHash: transactionHash,
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QuickNode webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Workflow dengan QuickNode:**
```
1. Helper post di Farcaster
   ↓
2. Frontend create pending verification
   ↓
3. Polling Neynar API untuk verify post (OFF-CHAIN)
   ↓
4. Post verified → Call recordReminder() contract
   ↓
5. ✅ QUICKNODE WEBHOOK: Receive notification bahwa recordReminder() sudah confirmed on-chain
   ↓
6. Update database: Mark as recorded
   ↓
7. Notify frontend: Transaction confirmed
```

---

### **Opsi 2: Monitor All Contract Interactions**

**Use Case:** Track semua activity pada ReminderVault contract

**Benefits:**
- Monitor semua functions: `createReminder`, `confirmReminder`, `claimReward`, `recordReminder`
- Real-time dashboard untuk all on-chain activity
- Analytics dan monitoring

**Setup:**
- Filter by contract address
- Monitor all events atau specific events
- Route ke different endpoints berdasarkan event type

---

## 🎯 Hybrid Approach: QuickNode + Neynar

**Best Practice:** Kombinasi QuickNode webhooks + Neynar API polling

### **Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Helper post di Farcaster                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Polling Neynar API (OFF-CHAIN verification)             │
│    - Check casts untuk mention + keywords                  │
│    - Verify post content                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Post verified → Call recordReminder() contract          │
│    - On-chain transaction                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ✅ QUICKNODE WEBHOOK                                     │
│    - Receive notification ketika transaction confirmed     │
│    - Update database: Mark as recorded on-chain           │
│    - Notify frontend: Transaction success                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend receive notification → Show success toast      │
└─────────────────────────────────────────────────────────────┘
```

**Keuntungan:**
- ✅ Neynar API untuk verifikasi post (OFF-CHAIN)
- ✅ QuickNode webhook untuk on-chain confirmation (real-time)
- ✅ Tidak perlu polling untuk check transaction status
- ✅ Efficient: Hanya receive notification ketika ada event

---

## 📋 Requirements untuk QuickNode Webhooks

### **1. QuickNode Account dengan Webhook Access**

- Login ke QuickNode Dashboard
- Ensure webhook feature enabled (check plan/limits)
- Get webhook secret key untuk signature verification

### **2. Public Webhook Endpoint**

**File:** `app/api/webhooks/quicknode-record/route.ts`

- Must be HTTPS
- Must be public (accessible from internet)
- Handle POST requests

### **3. Webhook Signature Verification**

**File:** `lib/utils/quicknode-webhook-verification.ts`

```typescript
import crypto from 'crypto';

export function verifyQuickNodeWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // QuickNode typically uses HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### **4. Contract ABI untuk Event Parsing**

**File:** `lib/contracts/config.ts`

Perlu ABI untuk parse event data:

```typescript
export const RECORD_REMINDER_EVENT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "reminderId", "type": "uint256" },
      { "indexed": false, "name": "neynarScore", "type": "uint256" },
      { "indexed": true, "name": "helper", "type": "address" }
    ],
    "name": "RecordReminder",
    "type": "event"
  }
];
```

---

## ⚠️ Limitations

### **QuickNode Webhooks TIDAK bisa digunakan untuk:**

1. ❌ **Verifikasi Farcaster casts**
   - QuickNode hanya monitor blockchain events
   - Farcaster casts adalah off-chain social data
   - Perlu Neynar API atau Farcaster Hub

2. ❌ **Monitor off-chain activity**
   - Hanya on-chain events
   - Contract events, transactions, blocks

3. ❌ **Real-time cast detection**
   - Tidak bisa detect ketika helper post di Farcaster
   - Hanya detect ketika contract function dipanggil

---

## ✅ Summary

### **QuickNode Webhooks BISA digunakan untuk:**

- ✅ **On-chain confirmation** ketika `recordReminder()` confirmed
- ✅ **Real-time transaction notifications** tanpa polling
- ✅ **Monitor contract events** untuk analytics
- ✅ **Track on-chain activity** pada ReminderVault

### **QuickNode Webhooks TIDAK bisa digunakan untuk:**

- ❌ Verifikasi Farcaster casts (perlu Neynar API)
- ❌ Detect ketika helper post (perlu Farcaster Hub/Neynar)
- ❌ Off-chain social events

### **Recommended Approach:**

**Hybrid: Neynar API (verification) + QuickNode Webhooks (confirmation)**

1. Use **Neynar API polling** untuk verify Farcaster post (OFF-CHAIN)
2. Use **QuickNode webhooks** untuk get notification ketika transaction confirmed (ON-CHAIN)
3. Best of both worlds: Efficient verification + Real-time on-chain notifications

---

## 📚 References

- QuickNode Webhooks Docs: https://www.quicknode.com/docs/quickalerts/quickalerts-destinations/overview
- QuickNode QuickAlerts: https://www.quicknode.com/quickalerts/
- QuickNode Getting Started: https://www.quicknode.com/guides/quicknode-products/quickalerts/get-started-with-webhooks

---

## 🔄 Next Steps

Jika ingin implement QuickNode webhooks untuk on-chain confirmation:

1. ✅ Setup QuickNode webhook di dashboard
2. ✅ Create webhook endpoint (`/api/webhooks/quicknode-record`)
3. ✅ Implement signature verification
4. ✅ Update database ketika receive webhook
5. ✅ Test dengan manual transaction
6. ✅ Integrate dengan existing verification flow

Untuk verifikasi Farcaster casts, tetap gunakan:
- **Current approach:** Neynar API polling
- **Future enhancement:** Farcaster Hub events (jika mau self-host)

