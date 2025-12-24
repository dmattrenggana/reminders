# 🚀 Supabase Setup - Quick Start Guide

## Langkah-langkah Setup Supabase (5-10 menit)

### **Step 1: Create Supabase Project**

1. **Buka browser** dan kunjungi: https://supabase.com
2. **Sign up / Login** dengan GitHub account
3. **Click "New Project"**
4. **Isi form:**
   - **Name:** `reminders-base`
   - **Database Password:** (buat password, SAVE ini!)
   - **Region:** **US East (N. Virginia)** (closest to Vercel)
   - **Pricing Plan:** Free
5. **Click "Create new project"**
6. **Wait 2 minutes** untuk project setup

---

### **Step 2: Create Database Table**

1. Di Supabase Dashboard, click **"SQL Editor"** (sidebar kiri)
2. Click **"New Query"**
3. **Copy-paste SQL ini** ke editor:

```sql
-- Create pending_verifications table
CREATE TABLE IF NOT EXISTS pending_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id INTEGER NOT NULL,
  helper_fid BIGINT NOT NULL,
  helper_address TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
  neynar_score NUMERIC(5, 4),
  estimated_reward TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ
);

-- Create indexes for fast queries
CREATE INDEX idx_pending_verifications_helper_reminder 
  ON pending_verifications(helper_fid, reminder_id);

CREATE INDEX idx_pending_verifications_status_expires 
  ON pending_verifications(status, expires_at);

CREATE INDEX idx_pending_verifications_created_at
  ON pending_verifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE pending_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations from service role
CREATE POLICY "Allow service role all operations"
  ON pending_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anon read access (for Realtime subscriptions)
CREATE POLICY "Allow anon read access"
  ON pending_verifications
  FOR SELECT
  TO anon
  USING (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE pending_verifications;
```

4. **Click "Run"** (atau press `Ctrl+Enter`)
5. **Verify success:** Should see "Success. No rows returned"

---

### **Step 3: Get API Keys**

1. Click **"Settings"** (icon gear di sidebar)
2. Click **"API"**
3. **Copy these values:**

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (⚠️ Keep this secret!)
```

4. **Save these** - you'll need them next!

---

### **Step 4: Add to Environment Variables**

#### **A. Local Development (.env.local):**

Create/update `.env.local`:

```env
# Existing vars...
NEYNAR_API_KEY=your_existing_neynar_key

# Add these NEW Supabase vars:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key
```

⚠️ **Replace with YOUR actual values from Step 3!**

#### **B. Vercel Production:**

```bash
# Add to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://xxxxx.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGc...your_anon_key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGc...your_service_role_key
```

Or via Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select project `remindersbase`
3. Settings → Environment Variables
4. Add 3 new variables (from above)

---

### **Step 5: Verify Realtime is Enabled**

1. In Supabase Dashboard, click **"Database"** → **"Replication"**
2. Find `pending_verifications` table
3. **Enable Realtime** toggle should be ON ✅
4. If not, click toggle to enable

---

## ✅ Setup Complete!

You should now have:
- ✅ Supabase project created
- ✅ Database table `pending_verifications` created
- ✅ Indexes created for performance
- ✅ Row Level Security configured
- ✅ Realtime enabled
- ✅ API keys copied
- ✅ Environment variables set

**Next:** I'll update the code to use Supabase!

---

## 🧪 Quick Test (Optional)

Test if Realtime works:

1. In Supabase Dashboard, click **"Table Editor"**
2. Select `pending_verifications` table
3. Click **"Insert row"**
4. Fill minimal data:
   - `reminder_id`: 1
   - `helper_fid`: 12345
   - `helper_address`: 0x123
   - `creator_username`: testuser
   - `expires_at`: (future date, e.g., tomorrow)
5. Click **"Save"**
6. Should see new row appear ✅

**Delete test row after verification.**

---

## 🆘 Troubleshooting

### **Error: "relation pending_verifications does not exist"**
- Fix: Re-run the SQL from Step 2

### **Error: "permission denied for table"**
- Fix: Check Row Level Security policies in Step 2

### **Realtime not working**
- Fix: Verify Realtime is enabled in Database → Replication

### **Can't connect from app**
- Fix: Double-check environment variables are correct

---

## 📚 Next Steps

After Supabase setup complete:
1. I'll install Supabase client library
2. Create Supabase service layer
3. Update API routes
4. Update frontend hooks
5. Test end-to-end flow

**Let me know when Step 1-5 are done!** 🚀

