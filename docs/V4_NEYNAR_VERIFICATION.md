# 🔍 Neynar Verification & Signer Setup

## Question: Apakah Perlu Signer untuk Check Post & Mention?

### **Short Answer:**

**❌ TIDAK perlu signer untuk CHECK** apakah helper sudah post dan mention  
**✅ PERLU signer untuk POST** notification (opsional)

---

## 📊 **Current Implementation**

### **1. Check Helper Post (Current - No Verification)**

**File:** `app/api/reminders/record/route.ts`

**Current Flow:**
```typescript
// 1. Get Neynar score (no signer needed)
const neynarClient = new NeynarAPIClient({ apiKey });
const userdata = await neynarClient.fetchBulkUsers({ fids: [helperFid] });

// 2. Check if already helped (on-chain check)
const helpers = await contract.getHelpersFor(reminderId);
if (helpers.includes(helperAddress)) {
  return { error: "Already helped" };
}

// 3. Return data for frontend
// ❌ NO VERIFICATION if user actually posted!
```

**Problem:** Tidak verify apakah user benar-benar sudah post mention!

---

## ✅ **Recommended: Add Post Verification**

### **Option A: Verify via Neynar API (Recommended)**

**No signer needed!** Cukup pakai Neynar API untuk check casts.

```typescript
// app/api/reminders/record/route.ts

// Add this function:
async function verifyHelperPost(
  neynarClient: NeynarAPIClient,
  helperFid: number,
  creatorUsername: string,
  reminderId: number
): Promise<boolean> {
  try {
    // Get recent casts from helper
    const casts = await neynarClient.fetchCastsForUser({
      fid: helperFid,
      limit: 10
    });

    // Check if any cast mentions creator and reminder
    const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
    const reminderPattern = new RegExp(`#${reminderId}|reminder.*${reminderId}`, 'i');

    for (const cast of casts.casts) {
      const text = cast.text.toLowerCase();
      if (mentionPattern.test(text) && reminderPattern.test(text)) {
        // Check if cast is recent (within last hour)
        const castTime = new Date(cast.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (castTime > oneHourAgo) {
          return true; // ✅ Verified!
        }
      }
    }

    return false; // ❌ No valid post found
  } catch (error) {
    console.error("Verify post error:", error);
    return false;
  }
}

// Use in route:
const hasPosted = await verifyHelperPost(
  neynarClient,
  Number(helperFid),
  reminder.farcasterUsername,
  parseInt(reminderId)
);

if (!hasPosted) {
  return NextResponse.json({ 
    error: "Please post a mention first",
    message: "You must post and mention the creator before claiming reward"
  }, { status: 400 });
}
```

---

### **Option B: Trust-Based (Current)**

**Current approach:** Trust user sudah post, hanya check on-chain.

**Pros:**
- ✅ Simple
- ✅ Fast
- ✅ No API calls needed

**Cons:**
- ❌ No verification
- ❌ Users bisa claim tanpa post
- ❌ Less secure

---

## 🔐 **Signer untuk POST Notification**

### **When Signer is Needed:**

**Signer hanya diperlukan untuk POST cast (mengirim notification), bukan untuk CHECK.**

**File:** `lib/farcaster/neynar-service.ts`

```typescript
// This needs signer:
const signerUuid = process.env.FARCASTER_SIGNER_UUID
if (!signerUuid) {
  console.error("FARCASTER_SIGNER_UUID is missing")
  return false
}

// POST cast with signer
await fetch("https://api.neynar.com/v2/farcaster/cast", {
  method: "POST",
  headers: {
    "X-API-Key": this.apiKey,
  },
  body: JSON.stringify({
    signer_uuid: signerUuid, // ← Signer needed here
    text: `Reminder: ${description}`,
  }),
})
```

### **Setup Signer:**

1. **Create Signer via Neynar:**
   ```bash
   # Via Neynar API
   curl -X POST https://api.neynar.com/v2/farcaster/signer \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"fid": YOUR_FID}'
   ```

2. **Get Signer UUID:**
   - Response akan return `signer_uuid`
   - Copy UUID ini

3. **Add to Environment:**
   ```env
   FARCASTER_SIGNER_UUID=your_signer_uuid_here
   ```

---

## 📋 **Summary**

| Action | Need Signer? | Why |
|--------|--------------|-----|
| **Check if user posted** | ❌ No | Use Neynar API `fetchCastsForUser` |
| **Get Neynar score** | ❌ No | Use Neynar API `fetchBulkUsers` |
| **POST notification** | ✅ Yes | Need signer to post on behalf of app |
| **Verify mention** | ❌ No | Parse cast text via API |

---

## 🎯 **Recommended Implementation**

### **1. Add Post Verification (No Signer)**

Update `app/api/reminders/record/route.ts`:

```typescript
// Add verification
const hasPosted = await verifyHelperPost(
  neynarClient,
  Number(helperFid),
  creatorUsername,
  parseInt(reminderId)
);

if (!hasPosted) {
  return NextResponse.json({ 
    error: "Please post mention first"
  }, { status: 400 });
}
```

### **2. Keep Signer for Notifications (Optional)**

Signer hanya untuk POST notification, bukan untuk verification.

---

## ⚠️ **Important Notes**

### **1. Neynar API Rate Limits**
- Free tier: ~100 requests/minute
- Check casts bisa expensive jika banyak helpers
- Consider caching or batch checking

### **2. Cast Timing**
- Only verify casts within last hour (T-1 hour window)
- Older casts don't count

### **3. Mention Format**
- Check for `@username` mention
- Check for reminder ID in text
- Case-insensitive matching

---

**Last Updated**: December 22, 2025  
**Status**: Verification recommended but not required

