# 🔍 Cara Verifikasi Helper - Alur Lengkap

## 📋 Ringkasan

Ketika helper mengklik tombol **"Help Remind Me"**, sistem melakukan verifikasi **otomatis** untuk memastikan helper benar-benar sudah melakukan post mention creator di Farcaster sebelum bisa claim reward. Verifikasi ini dilakukan secara **OFF-CHAIN** via Neynar API dan Supabase.

---

## 🔄 Alur Lengkap Verifikasi Helper

### **Step 1: Helper Klik "Help Remind Me"** 🖱️

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()`

**Yang Terjadi:**
1. Validasi wallet dan Farcaster FID terhubung
2. Ambil informasi creator (username) dari reminder card
3. Format post template dengan mention creator

**Post Template:**
```
Tick-tock, @creatorUsername ! Don't forget your [reminder description] is approaching at [deadline]. Beat the clock and get it done now! https://remindersbase.vercel.app/ ⏰
```

**Code:**
```typescript
const postText = `Tick-tock, @${creatorUsername} ! Don't forget your ${reminderDescription} is approaching at ${formattedDeadline}. Beat the clock and get it done now! ${appUrl.trim()} ⏰`;
```

---

### **Step 2: Buat Pending Verification di Supabase** 📝

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()` (line 688-810)

**API Endpoint:** `POST /api/reminders/record`

**Yang Terjadi:**
1. Buat entry di Supabase table `pending_verifications` dengan status `pending`
2. Simpan data:
   - `reminder_id`: ID reminder
   - `helper_address`: Wallet address helper
   - `helper_fid`: Farcaster FID helper
   - `creator_username`: Username creator
   - `status`: `pending`
   - `id`: Verification token (UUID)

**Request Body:**
```json
{
  "reminderId": 123,
  "helperAddress": "0x...",
  "helperFid": 12345,
  "creatorUsername": "alice",
  "useSupabase": true
}
```

**Response:**
```json
{
  "success": true,
  "verification_token": "uuid-token-here"
}
```

---

### **Step 3: Buka Farcaster Composer** 📱

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()` (line 830-900)

**Yang Terjadi:**
1. Jika di Farcaster MiniApp: Gunakan `sdk.actions.openComposer({ text: postText })`
2. Jika di browser: Buka Warpcast URL dengan pre-filled text

**Code:**
```typescript
if (isMiniApp && sdk.actions.openComposer) {
  await sdk.actions.openComposer({ text: postText });
} else {
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`;
  window.open(warpcastUrl, '_blank');
}
```

**Status yang Ditampilkan:**
- `"Opening Farcaster to post..."`
- `"Waiting for you to post and return..."`

---

### **Step 4: Helper Post di Farcaster** ✍️

**Syarat Post yang Valid:**
1. ✅ **Mention creator**: Harus ada `@creatorUsername` di post
2. ✅ **Keyword atau URL**: Harus ada salah satu:
   - `Tick-tock`
   - `Beat the clock`
   - `approaching`
   - `remindersbase.vercel.app`

**Contoh Post yang Valid:**
```
Tick-tock, @alice ! ⏰ Don't forget your Finish project proposal is approaching at Dec 25, 2024, 2:00 PM. Beat the clock and get it done now! https://remindersbase.vercel.app/
```

**Contoh Post yang Tidak Valid:**
```
Hey @alice, don't forget! ❌ (tidak ada keyword/URL)
```

---

### **Step 5: Automatic Verification (Otomatis!)** 🤖

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()` (line 900-1050)

**Dua Metode Verifikasi:**

#### **A. Supabase Realtime (Instant)** ⚡

**Yang Terjadi:**
1. Subscribe ke Supabase Realtime channel `verification-{token}`
2. Backend cron job (`/api/cron/verify-pending`) memverifikasi setiap 10 detik
3. Ketika post terverifikasi, status di Supabase diupdate ke `verified`
4. Realtime subscription menerima update **instan**

**Code:**
```typescript
const channel = supabase
  .channel(`verification-${verificationToken}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pending_verifications',
    filter: `id=eq.${verificationToken}`,
  }, (payload) => {
    if (payload.new.status === 'verified') {
      verificationComplete = true;
      verificationData = payload.new;
    }
  })
  .subscribe();
```

#### **B. Frontend Polling (Backup)** 🔄

**Yang Terjadi:**
1. Polling `/api/verify-post` setiap 5 detik
2. Maksimal 3 menit (36 attempts)
3. Stop jika verifikasi berhasil atau timeout

**Code:**
```typescript
const pollInterval = setInterval(async () => {
  const verifyResponse = await fetch("/api/verify-post", {
    method: "POST",
    body: JSON.stringify({ verificationToken }),
  });
  
  const verifyData = await verifyResponse.json();
  if (verifyData.success && verifyData.status === 'verified') {
    verificationComplete = true;
    clearInterval(pollInterval);
  }
}, 5000); // Poll every 5 seconds
```

---

### **Step 6: Verifikasi via Neynar API** 🔍

**File:** `app/api/verify-post/route.ts` dan `app/api/reminders/record/route.ts`

**API Endpoint:** `POST /api/verify-post`

**Yang Terjadi:**
1. Ambil verification token dari request
2. Cari entry di Supabase `pending_verifications`
3. Jika status masih `pending`, lakukan verifikasi:
   - Ambil 20 cast terbaru dari helper (via Neynar API)
   - Cek apakah ada cast yang:
     - Mention creator (`@creatorUsername`)
     - Mengandung keyword/URL reminder
     - Post dalam 10 menit terakhir
4. Jika ditemukan, update status ke `verified` dan simpan:
   - `neynar_score`: Score dari Neynar (0-1)
   - `estimated_reward`: Estimasi reward yang akan diterima

**Code Verifikasi:**
```typescript
async function verifyHelperPost(
  neynarClient: NeynarAPIClient,
  helperFid: number,
  creatorUsername: string,
  reminderId: number
): Promise<boolean> {
  // Get recent casts from helper (last 20)
  const casts = await neynarClient.fetchCastsForUser({
    fid: helperFid,
    limit: 20
  });

  // Check if any cast mentions creator and contains reminder keywords
  const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
  const reminderPattern = new RegExp(
    `remindersbase\\.vercel\\.app|Tick-tock|Beat the clock|approaching`,
    'i'
  );

  for (const cast of casts.casts) {
    const hasMention = mentionPattern.test(cast.text);
    const hasReminderContent = reminderPattern.test(cast.text);
    
    if (hasMention && hasReminderContent) {
      // Check if cast is recent (within last 10 minutes)
      const castTime = new Date(cast.timestamp);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      if (castTime > tenMinutesAgo) {
        return true; // ✅ Verified!
      }
    }
  }
  
  return false; // ❌ No valid post found
}
```

---

### **Step 7: Dapatkan Signature dari Backend** ✍️

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()` (line 1055-1095)

**API Endpoint:** `POST /api/sign-claim`

**Yang Terjadi:**
1. Setelah verifikasi berhasil, minta signature dari backend
2. Backend membuat EIP-712 signature untuk `claimReward`
3. Signature digunakan untuk claim reward di contract

**Request:**
```json
{
  "reminderId": 123,
  "helperAddress": "0x...",
  "neynarScore": 0.95
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x..."
}
```

---

### **Step 8: Claim Reward di Contract** 💰

**File:** `hooks/use-reminder-actions.ts` → `helpRemind()` (line 1097-1130)

**Contract Function:** `claimReward(uint256 reminderId, uint256 neynarScore, bytes memory signature)`

**Yang Terjadi:**
1. Panggil contract function `claimReward` dengan:
   - `reminderId`: ID reminder
   - `neynarScore`: Score dari Neynar (0-100, dikalikan 100)
   - `signature`: Signature dari backend
2. Contract memverifikasi signature
3. Jika valid, helper menerima reward sesuai tier:
   - **TIER_HIGH** (score ≥ 90): 10% dari reward pool
   - **TIER_MEDIUM** (score ≥ 50): 6% dari reward pool
   - **TIER_LOW** (score < 50): 3% dari reward pool

**Code:**
```typescript
const claimTxHash = await writeContractAsync({
  address: CONTRACTS.REMINDER_VAULT,
  abi: REMINDER_VAULT_ABI,
  functionName: 'claimReward',
  args: [
    BigInt(reminderId),
    BigInt(Math.floor(neynarScore * 100)), // Convert 0-1 to 0-100
    signature as `0x${string}`
  ],
  chainId: 8453,
});
```

---

## 📊 Diagram Alur Verifikasi

```
Helper Klik "Help Remind Me"
         ↓
1. Buat Pending Verification (Supabase)
         ↓
2. Buka Farcaster Composer
         ↓
3. Helper Post di Farcaster
         ↓
4. Automatic Verification Dimulai:
   ├─ A. Supabase Realtime (instant)
   └─ B. Frontend Polling (backup, 5s interval)
         ↓
5. Backend Verifikasi via Neynar API:
   ├─ Ambil 20 cast terbaru helper
   ├─ Cek mention creator
   ├─ Cek keyword/URL reminder
   └─ Cek waktu post (max 10 menit)
         ↓
6. Update Status ke "verified" (Supabase)
         ↓
7. Dapatkan Signature dari Backend
         ↓
8. Claim Reward di Contract
         ↓
✅ Reward Diterima!
```

---

## 🔧 Komponen yang Terlibat

### **Frontend:**
- `hooks/use-reminder-actions.ts` → `helpRemind()`: Main flow
- `components/reminders/reminder-card.tsx` → Button "Help Remind Me"

### **Backend APIs:**
- `app/api/reminders/record/route.ts`: Create pending verification
- `app/api/verify-post/route.ts`: Verify helper post
- `app/api/sign-claim/route.ts`: Get signature for claim
- `app/api/cron/verify-pending/route.ts`: Cron job untuk auto-verify

### **Database:**
- `lib/supabase/verification-service.ts`: Supabase operations
- Table: `pending_verifications`

### **External Services:**
- **Neynar API**: Fetch casts, verify post
- **Supabase Realtime**: Instant updates
- **Farcaster SDK**: Open composer

---

## ⚙️ Konfigurasi

### **Verification Timeout:**
- **Max Wait Time**: 3 menit
- **Polling Interval**: 5 detik
- **Cast Time Window**: 10 menit (post harus dalam 10 menit terakhir)

### **Cron Job:**
- **Schedule**: Setiap 10 detik (via Supabase Edge Function atau Vercel Cron)
- **Function**: Verifikasi semua pending verifications

### **Keywords yang Valid:**
- `Tick-tock`
- `Beat the clock`
- `approaching`
- `remindersbase.vercel.app`

---

## ✅ Keuntungan Sistem Ini

1. **Otomatis**: Tidak perlu tombol "I Posted"
2. **Real-time**: Supabase Realtime untuk update instan
3. **Reliable**: Dual verification (Realtime + Polling)
4. **Secure**: Signature-based claim (EIP-712)
5. **Fast**: Polling setiap 5 detik, max 3 menit

---

## 🐛 Troubleshooting

### **Verification Timeout:**
- Pastikan post mention creator dan mengandung keyword/URL
- Pastikan post dalam 10 menit terakhir
- Cek console log untuk detail error

### **Realtime Tidak Berfungsi:**
- Polling akan tetap berjalan sebagai backup
- Pastikan Supabase Realtime enabled

### **Signature Error:**
- Pastikan backend memiliki private key untuk signing
- Cek environment variable `SIGNER_PRIVATE_KEY`

---

**Last Updated:** December 22, 2024

