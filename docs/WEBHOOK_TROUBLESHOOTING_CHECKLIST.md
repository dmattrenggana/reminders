# 🔧 Webhook Troubleshooting Checklist

## ❌ Masalah: Webhook Tidak Berfungsi

Gunakan checklist ini untuk debug webhook yang tidak berfungsi.

---

## ✅ Checklist 1: Environment Variables

### **Cek File `.env.local`:**

\`\`\`bash
# File harus ada di root project
cat .env.local
\`\`\`

**Harus ada:**
\`\`\`env
NEYNAR_API_KEY=your_actual_api_key_here
\`\`\`

### **Cek di Vercel Dashboard:**

1. Buka: https://vercel.com/dashboard
2. Pilih project `remindersbase`
3. Settings → Environment Variables
4. Pastikan ada: `NEYNAR_API_KEY`

**Jika belum ada:**
\`\`\`bash
# Via Vercel CLI
vercel env add NEYNAR_API_KEY

# Atau via dashboard: Settings → Environment Variables → Add
\`\`\`

**⚠️ PENTING:** Setelah add environment variable, **REDEPLOY** aplikasi!

\`\`\`bash
# Trigger redeploy
vercel --prod

# Atau via dashboard: Deployments → Redeploy
\`\`\`

---

## ✅ Checklist 2: Setup Webhook di Neynar

### **A. Jalankan Setup Script:**

\`\`\`bash
# Test script locally first
npx tsx scripts/setup-neynar-webhook.ts
\`\`\`

**Expected output:**
\`\`\`
🚀 Setting up Neynar webhook...
Webhook URL: https://remindersbase.vercel.app/api/webhooks/neynar-cast
✅ Webhook created successfully!
Webhook response: { ... }
\`\`\`

**Possible errors:**

1. **Error: NEYNAR_API_KEY not found**
   - Fix: Add `NEYNAR_API_KEY` to `.env.local`
   
2. **Error: Webhook already exists**
   - Fix: Webhook sudah ada, cek di dashboard atau delete dulu

3. **Error: Invalid API key**
   - Fix: Verify API key di https://neynar.com/dashboard → API Keys

### **B. Verify di Neynar Dashboard:**

1. Login: https://neynar.com/dashboard
2. Webhooks → Cari "Reminders Base Verification"
3. Pastikan:
   - ✅ Status: **Active** (hijau)
   - ✅ URL: `https://remindersbase.vercel.app/api/webhooks/neynar-cast`
   - ✅ Event: `cast.created`
   - ✅ Filter: Pattern regex yang benar

---

## ✅ Checklist 3: Test Webhook Endpoint

### **A. Test Endpoint Accessibility:**

\`\`\`bash
# Test dari terminal (curl)
curl -X POST https://remindersbase.vercel.app/api/webhooks/neynar-cast \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cast.created",
    "data": {
      "hash": "0xtest",
      "text": "Tick-tock, @testuser ! Don'\''t forget https://remindersbase.vercel.app/",
      "author": {
        "fid": 12345
      },
      "timestamp": "2024-12-25T10:00:00Z"
    }
  }'
\`\`\`

**Expected response:**
\`\`\`json
{
  "success": true,
  "verified": 0,
  "message": "No pending verification found"
}
\`\`\`

**If error 404 or 500:** Webhook endpoint tidak accessible atau error di code

### **B. Cek Vercel Deployment:**

\`\`\`bash
# Via Vercel CLI
vercel logs --follow

# Atau via dashboard: Deployments → Latest → Functions Logs
\`\`\`

**Cari log:**
\`\`\`
[Webhook] Received Neynar webhook: { type: 'cast.created', ... }
\`\`\`

---

## ✅ Checklist 4: Test Full Flow

### **Step-by-Step Test:**

1. **Create test reminder:**
   - Buka app: https://remindersbase.vercel.app
   - Connect wallet
   - Create reminder dengan deadline ~1 jam dari sekarang
   - Note: reminder ID dan creator username

2. **Click "Help to remind" (saat T-1 hour):**
   - Cek console browser untuk log:
   \`\`\`javascript
   [HelpRemind] Creating pending verification via webhook mode for reminder: X
   [HelpRemind] ✅ Pending verification created: uuid-token
   \`\`\`

3. **Post di Farcaster/Warpcast:**
   - Format exact:
   \`\`\`
   Tick-tock, @creatorusername ! ⏰ Don't forget your [description] is approaching. Beat the clock! https://remindersbase.vercel.app/
   \`\`\`
   - **PENTING:** Ganti `@creatorusername` dengan username yang benar!

4. **Return to app:**
   - App akan polling status
   - Cek console:
   \`\`\`javascript
   [HelpRemind] Polling verification status (attempt 1/120). Token: xxx
   [HelpRemind] ✅ Post verified via webhook!
   \`\`\`

5. **Cek Vercel logs untuk webhook event:**
   \`\`\`
   [Webhook] Received Neynar webhook
   [Webhook] Processing cast: { authorFid: 12345, ... }
   [Webhook] ✅ Cast matches verification requirements
   [Webhook] ✅ Successfully verified reminder X for helper FID 12345
   \`\`\`

---

## ✅ Checklist 5: Common Issues & Fixes

### **Issue 1: "No pending verification found"**

**Cause:** Helper belum klik "Help to remind" atau verification expired

**Fix:**
1. Helper harus klik "Help to remind" dulu
2. Post dalam 10 menit (TTL)
3. Cek console untuk `[HelpRemind] Creating pending verification`

### **Issue 2: "Verification not found yet"**

**Cause:** Webhook belum receive event atau pending verification belum created

**Fix:**
1. Tunggu beberapa detik setelah post
2. Webhook mungkin delay ~5-10 detik
3. Cek Neynar webhook logs untuk delivery status

### **Issue 3: "Post verification failed"**

**Cause:** Cast content tidak match pattern

**Fix:**
1. Pastikan mention creator: `@username`
2. Pastikan ada keywords: `Tick-tock` + `Don't forget` + app URL
3. Post harus recent (< 10 menit)

**Debug pattern:**
\`\`\`javascript
// Pattern yang digunakan di webhook:
const mentionPattern = new RegExp(`@${creatorUsername}`, 'i');
const reminderPattern = new RegExp(
  `(Tick-tock|Don't forget|Beat the clock|approaching|remindersbase\\.vercel\\.app)`,
  'i'
);
\`\`\`

### **Issue 4: "Verification expired"**

**Cause:** Lebih dari 10 menit sejak klik "Help to remind"

**Fix:**
1. Klik "Help to remind" lagi (create new verification)
2. Post immediately (< 10 menit)

### **Issue 5: Webhook tidak receive events**

**Cause:** Webhook tidak aktif atau pattern tidak match

**Fix:**
1. **Cek status webhook** di Neynar dashboard (harus Active)
2. **Simplify pattern** di webhook filter:
   \`\`\`
   remindersbase.vercel.app
   \`\`\`
   (hapus regex kompleks jika masalah persist)
3. **Test dengan simple cast:**
   \`\`\`
   Test https://remindersbase.vercel.app/
   \`\`\`

---

## 🔍 Advanced Debugging

### **1. Enable Debug Logs**

Tambahkan di `app/api/webhooks/neynar-cast/route.ts`:

\`\`\`typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ADD: Full request logging
    console.log('[Webhook DEBUG] Full request body:', JSON.stringify(body, null, 2));
    console.log('[Webhook DEBUG] Request headers:', request.headers);
    
    // ... rest of code
  }
}
\`\`\`

Redeploy dan cek logs.

### **2. Check Webhook Delivery di Neynar**

Neynar Dashboard → Webhooks → [Your Webhook] → Delivery History

Cek:
- Request sent?
- Response code? (200 OK expected)
- Error messages?

### **3. Manual Test Pending Verification**

\`\`\`bash
# Test create pending verification directly
curl -X POST https://remindersbase.vercel.app/api/reminders/record \
  -H "Content-Type: application/json" \
  -d '{
    "reminderId": 1,
    "helperAddress": "0x123...",
    "helperFid": 12345,
    "creatorUsername": "testuser",
    "useWebhook": true
  }'
\`\`\`

Expected:
\`\`\`json
{
  "success": true,
  "verification_token": "uuid-here",
  "status": "pending"
}
\`\`\`

### **4. Test Verification Status API**

\`\`\`bash
# Get status (replace TOKEN with actual token)
curl https://remindersbase.vercel.app/api/verifications/TOKEN
\`\`\`

Expected (pending):
\`\`\`json
{
  "status": "pending",
  "reminderId": 1,
  "helperFid": 12345,
  "createdAt": "...",
  "expiresAt": "..."
}
\`\`\`

Expected (verified):
\`\`\`json
{
  "status": "verified",
  "neynarScore": 0.85,
  "estimatedReward": "0.123",
  "verifiedAt": "..."
}
\`\`\`

---

## 📋 Quick Diagnostic Script

Save as `test-webhook.sh`:

\`\`\`bash
#!/bin/bash

echo "=== Webhook Diagnostic Tool ==="
echo ""

# 1. Check .env.local
echo "1. Checking environment variables..."
if [ -f .env.local ]; then
  if grep -q "NEYNAR_API_KEY" .env.local; then
    echo "✅ NEYNAR_API_KEY found in .env.local"
  else
    echo "❌ NEYNAR_API_KEY NOT found in .env.local"
  fi
else
  echo "❌ .env.local file NOT found"
fi
echo ""

# 2. Test webhook endpoint
echo "2. Testing webhook endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://remindersbase.vercel.app/api/webhooks/neynar-cast \
  -H "Content-Type: application/json" \
  -d '{"type":"cast.created","data":{"hash":"test","text":"test","author":{"fid":123},"timestamp":"2024-01-01T00:00:00Z"}}')

if [ "$response" = "200" ]; then
  echo "✅ Webhook endpoint accessible (HTTP 200)"
else
  echo "❌ Webhook endpoint error (HTTP $response)"
fi
echo ""

# 3. Check Vercel deployment
echo "3. Checking Vercel deployment..."
echo "Run: vercel logs --follow"
echo "Look for: [Webhook] Received Neynar webhook"
echo ""

echo "=== Diagnostic Complete ==="
\`\`\`

Run:
\`\`\`bash
chmod +x test-webhook.sh
./test-webhook.sh
\`\`\`

---

## 🆘 Still Not Working?

### **Fallback to Polling Mode:**

Temporarily disable webhook mode untuk testing:

In `hooks/use-reminder-actions.ts`, change:
\`\`\`typescript
// From:
useWebhook: true,

// To:
useWebhook: false, // Use polling mode as fallback
\`\`\`

This will use direct API verification (polling) instead of webhook.

**Note:** Polling mode masih works tapi tidak real-time.

---

## 📞 Support Resources

- **Neynar Docs:** https://docs.neynar.com/docs/webhooks
- **Neynar Support:** Discord atau email support
- **Vercel Logs:** https://vercel.com/dashboard → Project → Logs
- **GitHub Issues:** Create issue dengan log details

---

## ✅ Success Indicators

Webhook berfungsi jika:

1. ✅ Script setup success (no errors)
2. ✅ Webhook active di Neynar dashboard
3. ✅ Endpoint returns 200 OK
4. ✅ Vercel logs show `[Webhook] Received`
5. ✅ Frontend logs show `[HelpRemind] ✅ Post verified via webhook!`
6. ✅ Helper dapat claim reward setelah creator confirm

Jika semua checklist ✅, webhook sudah berfungsi dengan baik!
