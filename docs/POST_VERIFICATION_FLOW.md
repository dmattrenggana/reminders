# 🔍 Cara Verifikasi Post Helper - Alur Lengkap

## 📋 Ringkasan

Sistem melakukan verifikasi **OFF-CHAIN** via Neynar API untuk memastikan helper benar-benar sudah melakukan post mention creator sebelum bisa claim reward. Verifikasi ini dilakukan secara otomatis setiap kali helper mencoba claim reward.

---

## 🔄 Alur Lengkap Verifikasi

### **Step 1: Helper Klik "Help to Remind"**

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()`

- Helper mengklik tombol "Help to remind" pada reminder card di Public Feed
- Sistem akan:
  1. Format post template dengan mention creator
  2. Buka Farcaster composer (miniapp) atau Warpcast URL (browser)
  3. Tampilkan instruksi untuk post dan kembali ke app

**Post Template:**
```
Tick-tock, @creatorUsername ! ⏰ 
Don't forget your [reminder description] is approaching at [deadline]. 
Beat the clock and get it done now! 
https://remindersbase.vercel.app/
```

---

### **Step 2: Helper Post di Farcaster**

Helper melakukan post di Farcaster/Warpcast dengan:
- ✅ Mention creator (`@creatorUsername`)
- ✅ Mention salah satu keyword:
  - `Tick-tock`
  - `Beat the clock`
  - `approaching`
  - `remindersbase.vercel.app` (app URL)

**Contoh Post yang Valid:**
```
Tick-tock, @alice ! ⏰ Don't forget your Finish project proposal is approaching at Dec 25, 2024, 2:00 PM. Beat the clock and get it done now! https://remindersbase.vercel.app/
```

---

### **Step 3: Helper Kembali ke Miniapp**

**Catatan Penting:**
- Helper perlu **kembali secara manual** ke miniapp setelah posting
- Farcaster SDK tidak menyediakan callback otomatis untuk redirect kembali
- Setelah kembali, sistem akan mulai polling untuk verifikasi

---

### **Step 4: Polling Verification (Frontend)**

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()` (line 655-758)

**Proses:**
1. **Polling dimulai** setelah helper kembali ke app
2. **Durasi polling:** 2 menit (120 attempts, setiap 1 detik)
3. Setiap attempt, frontend memanggil `/api/reminders/record`
4. Menampilkan progress: `Verifying your post... (1/120)`

**Code:**
```typescript
// Polling loop - maksimal 2 menit
while (verificationAttempts < 120 && !verificationSuccess) {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  verificationAttempts++;
  
  // Call API untuk verify
  const response = await fetch("/api/reminders/record", {
    method: "POST",
    body: JSON.stringify({
      reminderId: reminder.id,
      helperAddress: address,
      helperFid: fid,
      creatorUsername: creatorUsername,
    }),
  });
  
  // Jika response OK dan success: true → break loop
  // Jika 400 (not verified yet) → continue polling
  // Jika error lain → throw error
}
```

---

### **Step 5: Verifikasi Post via Neynar API (Backend)**

**File:** `app/api/reminders/record/route.ts` → `verifyHelperPost()`

**Proses Verifikasi:**

#### **5.1. Fetch Recent Casts dari Helper**
```typescript
// Get 20 cast terbaru dari helper (berdasarkan FID)
const casts = await neynarClient.fetchCastsForUser({
  fid: helperFid,
  limit: 20
});
```

#### **5.2. Pattern Matching**

**Pattern 1: Mention Creator**
```typescript
const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
// Case-insensitive match untuk @creatorUsername
```

**Pattern 2: Reminder Keywords**
```typescript
const reminderPattern = new RegExp(
  `remindersbase\\.vercel\\.app|Tick-tock|Beat the clock|approaching`,
  'i'
);
// Match salah satu keyword: URL app, "Tick-tock", "Beat the clock", atau "approaching"
```

#### **5.3. Validasi Cast**

Untuk setiap cast dalam 20 cast terbaru:

```typescript
for (const cast of casts.casts) {
  const text = cast.text;
  const hasMention = mentionPattern.test(text);          // Check mention
  const hasReminderContent = reminderPattern.test(text); // Check keywords
  
  if (hasMention && hasReminderContent) {
    // Check timestamp - harus dalam 10 menit terakhir
    const castTime = new Date(cast.timestamp);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    if (castTime > tenMinutesAgo) {
      return true; // ✅ VERIFIED!
    }
  }
}

return false; // ❌ Not verified
```

**Kondisi Verifikasi Berhasil:**
1. ✅ Cast mention creator (`@creatorUsername`)
2. ✅ Cast mengandung salah satu keyword/URL
3. ✅ Cast dibuat dalam 10 menit terakhir

---

### **Step 6: Calculate Neynar User Quality Score**

**File:** `app/api/reminders/record/route.ts` (line 117-166)

Setelah post terverifikasi, sistem mengambil **Neynar User Quality Score**:

```typescript
// Get user data dari Neynar API
const userdata = await neynarClient.fetchBulkUsers({ 
  fids: [helperFid] 
});

const user = userdata.users[0];
const neynarScore = user.profile.score; // 0.0 to 1.0

// Normalize score
const normalizedScore = Math.max(0, Math.min(1, neynarScore));
```

**Score digunakan untuk:**
- Menghitung reward percentage (tier-based):
  - Score ≥ 90% → 10% reward (TIER_HIGH)
  - Score ≥ 50% → 6% reward (TIER_MEDIUM)
  - Score < 50% → 3% reward (TIER_LOW)

---

### **Step 7: Response ke Frontend**

**Jika Verifikasi Berhasil:**
```json
{
  "success": true,
  "message": "Reminder verified and ready to record",
  "neynarScore": 0.85,
  "estimatedReward": "0.123",
  "user": "helper_username"
}
```

**Jika Verifikasi Gagal:**
```json
{
  "success": false,
  "error": "Post verification failed",
  "message": "Please post a mention of the creator (@username) with reminder keywords...",
  "status": 400
}
```

---

### **Step 8: Call Contract `recordReminder` (On-Chain)**

**File:** `hooks/use-reminder-actions.ts` (line 766-791)

Setelah verifikasi berhasil, frontend memanggil contract function:

```typescript
// Convert score dari 0-1.0 ke 0-100 (contract expects integer)
const neynarScore = Math.floor((data.neynarScore || 0.5) * 100);

// Call contract
const recordTxHash = await writeContractAsync({
  address: CONTRACTS.REMINDER_VAULT,
  abi: REMINDER_VAULT_ABI,
  functionName: 'recordReminder',
  args: [BigInt(reminder.id), BigInt(neynarScore)],
  chainId: 8453,
});

// Wait for confirmation
const recordReceipt = await publicClient.waitForTransactionReceipt({
  hash: recordTxHash,
  timeout: 60000,
});
```

**Contract Function:**
```solidity
function recordReminder(uint256 reminderId, uint256 neynarScore) external
```

---

### **Step 9: Auto Claim Reward (Jika Memungkinkan)**

**File:** `hooks/use-reminder-actions.ts` (line 793-865)

Setelah `recordReminder` berhasil, sistem check apakah bisa claim reward:

**Kondisi untuk Auto Claim:**
- Reminder sudah confirmed (`reminder.isConfirmed`)
- Atau `confirmationDeadline` sudah lewat

**Jika bisa claim:**
- Auto trigger `claimReward()` contract function
- Helper langsung dapat reward

**Jika belum bisa claim:**
- Tampilkan toast: "Reminder Recorded! You can claim when the reminder is confirmed."
- Helper bisa claim nanti setelah reminder confirmed

---

## 🎯 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Helper clicks "Help to remind"                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. System opens Farcaster composer with template           │
│    "Tick-tock, @creator ! ⏰ Don't forget..."              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Helper posts in Farcaster (mention + keywords)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Helper manually returns to miniapp                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend starts polling (max 2 minutes)                 │
│    Every 1 second: Call /api/reminders/record              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend verifyHelperPost() via Neynar API:              │
│    - Fetch 20 recent casts from helper                     │
│    - Check mention @creator                                │
│    - Check keywords (Tick-tock, Beat clock, etc)           │
│    - Check timestamp (< 10 minutes)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ✅ Verified    ❌ Not Found
                    │             │
                    │             └──► Continue polling (up to 2 min)
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Calculate Neynar User Quality Score                     │
│    - Fetch from user.profile.score                         │
│    - Calculate estimated reward (tier-based)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Return success response to frontend                     │
│    { success: true, neynarScore, estimatedReward }         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Frontend calls recordReminder(reminderId, score)        │
│    ON-CHAIN transaction                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Auto claim reward (if reminder confirmed/deadline)     │
│     OR show toast "You can claim later"                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Konfigurasi & Requirements

### **Environment Variables:**

```env
NEYNAR_API_KEY=your_neynar_api_key_here
```

### **Timing Configuration:**

- **Polling Duration:** 2 menit (120 attempts)
- **Polling Interval:** 1 detik per attempt
- **Cast Time Window:** 10 menit (cast harus dibuat dalam 10 menit terakhir)
- **Recent Casts Limit:** 20 cast terbaru

### **Verification Patterns:**

**Mention Pattern:**
- Case-insensitive regex: `@creatorUsername`
- Contoh: `@alice`, `@Alice`, `@ALICE` → semua match

**Keyword Pattern:**
- `remindersbase.vercel.app` (app URL)
- `Tick-tock` (case-insensitive)
- `Beat the clock` (case-insensitive)
- `approaching` (case-insensitive)

---

## 🔍 Debugging & Logging

### **Frontend Logs:**

```typescript
// Start polling
[HelpRemind] Starting verification polling for reminder: 16

// Each attempt
[HelpRemind] Verification attempt 5/120 for reminder 16

// Post not verified yet
[HelpRemind] ⏳ Post not verified yet (attempt 10/120): Post verification failed...

// Success
[HelpRemind] ✅ Post verified successfully: {
  neynarScore: 0.85,
  estimatedReward: "0.123",
  username: "helper_username"
}
```

### **Backend Logs:**

```typescript
// Start verification
[Record] Verifying post for helper 12345, creator @alice, reminder 16

// Verification success
[Verify] ✅ Post verified: Found cast with mention and reminder content {
  castText: "Tick-tock, @alice ! ⏰ Don't forget...",
  castTime: "2024-12-24T10:30:00.000Z"
}

// Verification failed
[Verify] ❌ No valid post found for helper 12345 mentioning @alice

// Final result
[Record] ✅ Post verified for helper 12345
[Record] ✅ Using Neynar User Quality Score from API: 0.85
```

---

## ❓ Frequently Asked Questions

### **Q1: Kenapa polling perlu 2 menit?**

**A:** Memberi waktu cukup untuk:
- Helper post di Farcaster
- Helper kembali ke miniapp (manual)
- Neynar API mendeteksi post baru (ada delay indexing)

### **Q2: Apa yang terjadi jika post tidak terverifikasi dalam 2 menit?**

**A:** 
- Polling timeout
- Error message: "Post verification timeout. Please ensure you posted..."
- Helper bisa coba lagi (klik "Help to remind" lagi)

### **Q3: Kenapa harus mention creator DAN keyword?**

**A:** Untuk memastikan:
- Helper benar-benar mention creator (bukan post random)
- Post terkait dengan reminder (ada keyword/URL app)

### **Q4: Apa yang terjadi jika Neynar API error?**

**A:**
- Backend return error 500
- Frontend throw error immediately (tidak continue polling)
- Helper perlu coba lagi nanti

### **Q5: Apakah helper bisa claim tanpa post?**

**A:** **TIDAK!** Verifikasi adalah **mandatory**. Tanpa post yang terverifikasi, helper tidak bisa call `recordReminder`.

---

## 📝 Summary

**Verifikasi post helper dilakukan dengan:**
1. ✅ **OFF-CHAIN** via Neynar API (tidak perlu gas)
2. ✅ **Automatic** - polling setiap 1 detik selama 2 menit
3. ✅ **Real-time** - check casts langsung dari Farcaster
4. ✅ **Accurate** - pattern matching untuk mention + keywords
5. ✅ **Time-bound** - cast harus dalam 10 menit terakhir

Setelah verifikasi berhasil, helper bisa:
- Call `recordReminder()` on-chain dengan Neynar score
- Auto claim reward (jika reminder sudah confirmed)
- Atau claim nanti setelah reminder confirmed

