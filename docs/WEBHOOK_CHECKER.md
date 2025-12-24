# 🔍 Cara Cek & Setup Webhook Neynar

## 📋 Langkah 1: Cek Webhook di Neynar Dashboard

### **A. Login ke Neynar Dashboard**

1. Buka browser dan kunjungi: **https://neynar.com/dashboard**
2. Login dengan akun Neynar Anda
3. Jika belum punya akun, daftar dulu di **https://neynar.com**

### **B. Navigasi ke Webhooks Section**

1. Setelah login, lihat sidebar kiri
2. Klik menu **"Webhooks"** atau **"Webhook Management"**
3. Anda akan melihat daftar webhook yang sudah ada (jika ada)

### **C. Cek Apakah Webhook Sudah Ada**

Cari webhook dengan:
- **Name:** `Reminders Base Verification`
- **URL:** `https://remindersbase.vercel.app/api/webhooks/neynar-cast`
- **Event Type:** `cast.created`

**Jika webhook sudah ada:**
- ✅ Status harus "Active" (warna hijau)
- ✅ URL harus matching dengan deployment Anda
- ✅ Event type harus `cast.created`

**Jika webhook belum ada atau tidak aktif:**
- ❌ Perlu setup webhook baru
- Lanjut ke Langkah 2

---

## 📋 Langkah 2: Setup Webhook (Pilih Salah Satu)

### **Option A: Setup via Script (Recommended)**

Jalankan script otomatis yang sudah disediakan:

```bash
# Pastikan environment variable sudah di-set
# Di file .env.local:
# NEYNAR_API_KEY=your_api_key_here

# Jalankan script
npx tsx scripts/setup-neynar-webhook.ts
```

**Output yang diharapkan:**
```
🚀 Setting up Neynar webhook...
Webhook URL: https://remindersbase.vercel.app/api/webhooks/neynar-cast
✅ Webhook created successfully!
Webhook response: {
  "webhook_id": "...",
  ...
}

📝 Next steps:
1. Test webhook dengan membuat cast yang match criteria
2. Check webhook logs di Neynar Dashboard
3. Monitor application logs untuk webhook events
```

**Jika ada error "already exists":**
- Webhook sudah ada, cek di dashboard
- Atau delete webhook lama dulu, lalu run script lagi

---

### **Option B: Setup Manual via Dashboard**

Jika script gagal atau prefer manual setup:

1. **Di Neynar Dashboard → Webhooks:**
   - Klik tombol **"Create Webhook"** atau **"New Webhook"**

2. **Isi Form:**
   - **Name:** `Reminders Base Verification`
   - **URL:** `https://remindersbase.vercel.app/api/webhooks/neynar-cast`
   - **Event Type:** Pilih `cast.created`

3. **Configure Filter (Advanced):**
   - Klik **"Add Filter"** atau **"Configure Subscription"**
   - Pilih **"Text Filter"**
   - Pattern: `(?i)(Tick-tock.*Don't forget.*https://remindersbase\.vercel\.app/)`
   - Atau pattern sederhana: `(?i)(Tick-tock|Don't forget|remindersbase\.vercel\.app)`

4. **Save & Activate:**
   - Klik **"Save"** atau **"Create Webhook"**
   - Pastikan status **"Active"**

---

## 📋 Langkah 3: Verifikasi Webhook Berfungsi

### **A. Test via Neynar Dashboard**

Beberapa dashboard Neynar menyediakan fitur "Test Webhook":
1. Klik webhook yang baru dibuat
2. Cari tombol **"Test"** atau **"Send Test Event"**
3. Kirim test event
4. Cek response: harus return `200 OK`

### **B. Test via Cast di Farcaster**

1. **Buat test reminder** di app (untuk dapat creator username)
2. **Post cast di Warpcast/Farcaster** dengan format:
   ```
   Tick-tock, @creator ! ⏰ Don't forget your reminder is approaching. Beat the clock! https://remindersbase.vercel.app/
   ```
3. **Tunggu beberapa detik**
4. **Cek logs:**
   - Neynar Dashboard → Webhooks → Logs
   - Vercel Dashboard → Deployment → Logs

### **C. Cek Application Logs**

**Di Vercel:**
1. Buka **https://vercel.com/dashboard**
2. Pilih project **remindersbase**
3. Klik **"Logs"** atau **"Functions"**
4. Filter: `api/webhooks/neynar-cast`
5. Cari log: `[Webhook] Received Neynar webhook`

**Expected logs jika webhook berfungsi:**
```
[Webhook] Received Neynar webhook: { type: 'cast.created', timestamp: '...' }
[Webhook] Processing cast: { hash: '...', authorFid: 12345, ... }
[Webhook] ✅ Cast matches verification requirements for reminder X
[Webhook] ✅ Successfully verified reminder X for helper FID 12345
```

---

## 🔧 Troubleshooting

### **1. Webhook tidak menerima events**

**Cek:**
- ✅ Webhook status "Active" di dashboard?
- ✅ URL correct? (`https://remindersbase.vercel.app/api/webhooks/neynar-cast`)
- ✅ Filter pattern correct?
- ✅ Cast mengandung keywords yang sesuai?

**Fix:**
- Update webhook URL jika deployment berubah
- Simplify filter pattern (hapus regex yang kompleks)
- Test dengan pattern sederhana: `remindersbase`

### **2. Webhook returns error**

**Cek Vercel logs:**
```
[Webhook] Error processing webhook: ...
```

**Common errors:**
- `NEYNAR_API_KEY not configured` → Set environment variable
- `No pending verification found` → Helper belum klik "Help to remind"
- `Cast does not match requirements` → Post tidak mengandung mention atau keywords

### **3. Verification timeout**

**Possible causes:**
- Webhook delay > 10 menit (TTL expired)
- Helper belum post atau post tidak match
- Webhook tidak aktif

**Fix:**
- Pastikan webhook aktif
- Post harus dalam 10 menit setelah klik "Help to remind"
- Pattern must match: mention creator + keywords + app URL

---

## 📊 Monitoring Webhook

### **Neynar Dashboard:**
- **Webhooks → [Your Webhook] → Logs**
- Lihat request/response history
- Cek success rate
- Debug failed webhooks

### **Vercel Logs:**
```bash
# Via Vercel CLI
vercel logs --follow

# Filter untuk webhook
vercel logs --follow | grep "Webhook"
```

### **Application Logs (Frontend):**
```javascript
// Di browser console
// Cek polling status:
[HelpRemind] Polling verification status (attempt 5/120). Token: xxx
[HelpRemind] ✅ Post verified via webhook!
```

---

## ✅ Checklist Setup Webhook

- [ ] Login ke Neynar Dashboard
- [ ] Navigasi ke Webhooks section
- [ ] Cek webhook existing (jika ada)
- [ ] Create webhook baru (via script atau manual)
- [ ] Set name: "Reminders Base Verification"
- [ ] Set URL: `https://remindersbase.vercel.app/api/webhooks/neynar-cast`
- [ ] Set event: `cast.created`
- [ ] Set filter pattern (optional tapi recommended)
- [ ] Activate webhook
- [ ] Test dengan post cast
- [ ] Verify di logs (Neynar + Vercel)
- [ ] Monitor webhook activity

---

## 🔗 Resources

- **Neynar Dashboard:** https://neynar.com/dashboard
- **Neynar Docs:** https://docs.neynar.com/docs/webhooks
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Setup Script:** `scripts/setup-neynar-webhook.ts`
- **Full Documentation:** `docs/NEYNAR_WEBHOOK_SETUP.md`

---

## 💡 Tips

1. **Save webhook ID** setelah create (untuk update/delete nanti)
2. **Monitor logs** regularly untuk ensure webhook berfungsi
3. **Test dengan real cast** (bukan hanya test event)
4. **Simplify pattern** jika terlalu banyak false negatives
5. **Use webhook logs** di Neynar untuk debug

