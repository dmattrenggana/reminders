# 🚀 Migrate Webhook Verification to Supabase

## Why Supabase?

Current implementation uses **in-memory Map** storage yang tidak persistent. Data hilang setiap kali:
- ❌ Vercel redeploy
- ❌ Serverless function restart
- ❌ Cold start

**Supabase solves this** dengan persistent Postgres database!

Source: [Supabase Documentation](https://supabase.com/docs)

---

## 📋 Step-by-Step Migration

### **Step 1: Create Supabase Project**

1. **Sign up**: https://supabase.com
2. **Create new project**:
   - Project name: `reminders-base`
   - Database password: (save this!)
   - Region: **US East** (closest to Vercel deployment)
3. Wait ~2 minutes for setup

---

### **Step 2: Create Database Table**

Di Supabase Dashboard → SQL Editor, run query ini:

\`\`\`sql
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

-- Create function to auto-expire old verifications
CREATE OR REPLACE FUNCTION expire_old_verifications()
RETURNS void AS $$
BEGIN
  UPDATE pending_verifications
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every 5 minutes (requires pg_cron extension)
-- Alternatively, call this from API route or use Supabase Edge Function
SELECT cron.schedule(
  'cleanup-expired-verifications',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT expire_old_verifications();'
);

-- Enable Row Level Security (optional for security)
ALTER TABLE pending_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations from service role (API)
CREATE POLICY "Allow service role all operations"
  ON pending_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
\`\`\`

---

### **Step 3: Install Supabase Client**

\`\`\`bash
npm install @supabase/supabase-js
\`\`\`

---

### **Step 4: Environment Variables**

Add to `.env.local` and Vercel:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For API routes only!
\`\`\`

**Get credentials:**
- Settings → API → Project URL
- Settings → API → Project API keys

⚠️ **IMPORTANT**: 
- `ANON_KEY` for frontend (safe to expose)
- `SERVICE_ROLE_KEY` for API routes only (keep secret!)

---

### **Step 5: Create Supabase Client Utility**

Create `lib/supabase/client.ts`:

\`\`\`typescript
import { createClient } from '@supabase/supabase-js';

// Client for API routes (has full access)
export function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Client for frontend (realtime subscriptions)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
\`\`\`

---

### **Step 6: Create Supabase Service**

Create `lib/supabase/verification-service.ts`:

\`\`\`typescript
import { getSupabaseServiceClient } from './client';

export interface PendingVerification {
  id: string;
  reminder_id: number;
  helper_fid: number;
  helper_address: string;
  creator_username: string;
  status: 'pending' | 'verified' | 'expired';
  neynar_score?: number;
  estimated_reward?: string;
  created_at: string;
  expires_at: string;
  verified_at?: string;
  webhook_received_at?: string;
}

/**
 * Create a new pending verification
 */
export async function createPendingVerification(data: {
  reminderId: number;
  helperFid: number;
  helperAddress: string;
  creatorUsername: string;
  expiresInMinutes?: number;
}): Promise<PendingVerification> {
  const supabase = getSupabaseServiceClient();
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (data.expiresInMinutes || 10));

  const { data: verification, error } = await supabase
    .from('pending_verifications')
    .insert({
      reminder_id: data.reminderId,
      helper_fid: data.helperFid,
      helper_address: data.helperAddress.toLowerCase(),
      creator_username: data.creatorUsername,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating verification:', error);
    throw error;
  }

  console.log(`[Supabase] Created pending verification ${verification.id} for reminder ${data.reminderId}`);
  return verification;
}

/**
 * Find pending verification by helper FID and reminder ID
 */
export async function findPendingVerification(
  helperFid: number,
  reminderId: number
): Promise<PendingVerification | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('pending_verifications')
    .select('*')
    .eq('helper_fid', helperFid)
    .eq('reminder_id', reminderId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error finding verification:', error);
    return null;
  }

  return data;
}

/**
 * Get pending verification by ID
 */
export async function getPendingVerificationById(
  id: string
): Promise<PendingVerification | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('pending_verifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Error getting verification:', error);
    return null;
  }

  // Auto-expire if needed
  if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
    await supabase
      .from('pending_verifications')
      .update({ status: 'expired' })
      .eq('id', id);
    
    data.status = 'expired';
  }

  return data;
}

/**
 * Mark verification as verified
 */
export async function markVerificationAsVerified(
  id: string,
  data: {
    neynarScore: number;
    estimatedReward: string;
  }
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('pending_verifications')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      webhook_received_at: new Date().toISOString(),
      neynar_score: data.neynarScore,
      estimated_reward: data.estimatedReward,
    })
    .eq('id', id)
    .eq('status', 'pending') // Only update if still pending
    .gt('expires_at', new Date().toISOString()); // Only if not expired

  if (error) {
    console.error('[Supabase] Error marking verification as verified:', error);
    return false;
  }

  console.log(`[Supabase] ✅ Marked verification ${id} as verified`);
  return true;
}

/**
 * Get all pending verifications for webhook processing
 */
export async function getAllPendingVerifications(): Promise<PendingVerification[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('pending_verifications')
    .select('*')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error getting all verifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Clean up old verifications
 */
export async function cleanupOldVerifications(maxAgeHours: number = 24): Promise<number> {
  const supabase = getSupabaseServiceClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - maxAgeHours);

  const { error, count } = await supabase
    .from('pending_verifications')
    .delete()
    .lt('created_at', cutoff.toISOString());

  if (error) {
    console.error('[Supabase] Error cleaning up old verifications:', error);
    return 0;
  }

  console.log(`[Supabase] Cleaned up ${count || 0} old verifications`);
  return count || 0;
}
\`\`\`

---

### **Step 7: Update API Routes**

#### **A. Update `/api/reminders/record/route.ts`**

Replace import:
\`\`\`typescript
// Old:
import { createPendingVerification, findPendingVerification } from '@/lib/utils/pending-verifications';

// New:
import { createPendingVerification, findPendingVerification } from '@/lib/supabase/verification-service';
\`\`\`

That's it! Function signatures are compatible.

#### **B. Update `/api/webhooks/neynar-cast/route.ts`**

Replace imports:
\`\`\`typescript
// Old:
const { getAllPendingVerifications } = await import('@/lib/utils/pending-verifications');
const { markVerificationAsVerified } = await import('@/lib/utils/pending-verifications');

// New:
import { getAllPendingVerifications, markVerificationAsVerified } from '@/lib/supabase/verification-service';
\`\`\`

#### **C. Update `/api/verifications/[token]/route.ts`**

Replace import:
\`\`\`typescript
// Old:
import { getPendingVerificationById } from '@/lib/utils/pending-verifications';

// New:
import { getPendingVerificationById } from '@/lib/supabase/verification-service';
\`\`\`

---

### **Step 8: Add Realtime Subscription (Optional - BONUS!)**

Update `hooks/use-reminder-actions.ts` untuk use Realtime instead of polling:

\`\`\`typescript
import { getSupabaseClient } from '@/lib/supabase/client';

// In helpRemind function, replace polling with subscription:

// OLD POLLING CODE (remove this):
/*
let verificationAttempts = 0;
const maxVerificationAttempts = 120;
while (verificationAttempts < maxVerificationAttempts && !verificationSuccess) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // ... polling logic
}
*/

// NEW REALTIME CODE:
const supabase = getSupabaseClient();

// Setup realtime subscription
const channel = supabase
  .channel(`verification-${verificationToken}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'pending_verifications',
      filter: `id=eq.${verificationToken}`,
    },
    (payload) => {
      console.log('[HelpRemind] Realtime update received:', payload);
      
      const newData = payload.new as any;
      
      if (newData.status === 'verified') {
        verificationSuccess = true;
        verificationData = {
          success: true,
          neynarScore: newData.neynar_score,
          estimatedReward: newData.estimated_reward,
        };
        
        // Unsubscribe after successful verification
        channel.unsubscribe();
        
        // Continue to recordReminder and claimReward
        proceedWithReward();
      } else if (newData.status === 'expired') {
        toast({
          title: "⏱️ Verification expired",
          description: "Please try again and post within 10 minutes.",
          variant: "destructive",
          duration: 2000,
        });
        
        channel.unsubscribe();
        setTxStatus(null);
      }
    }
  )
  .subscribe();

// Fallback timeout after 2 minutes
const timeoutId = setTimeout(() => {
  if (!verificationSuccess) {
    channel.unsubscribe();
    toast({
      title: "⏱️ Verification timeout",
      description: "Verification took too long. Please try again.",
      variant: "destructive",
      duration: 2000,
    });
    setTxStatus(null);
  }
}, 120000); // 2 minutes

// Helper function to proceed after verification
async function proceedWithReward() {
  clearTimeout(timeoutId);
  
  // Continue with recordReminder and claimReward as before
  // ... (existing code)
}
\`\`\`

---

### **Step 9: Deploy to Vercel**

1. **Add environment variables** to Vercel:
   \`\`\`bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   \`\`\`

2. **Redeploy**:
   \`\`\`bash
   git add .
   git commit -m "feat: migrate verification to Supabase"
   git push origin main
   \`\`\`

---

## ✅ Benefits Summary

### Before (In-Memory):
- ❌ Data lost on redeploy
- ❌ Webhook can't find verifications
- ❌ Frontend polls every 1 second (inefficient)
- ❌ Not scalable

### After (Supabase):
- ✅ **Persistent storage** - data survives redeploys
- ✅ **Realtime updates** - instant notification (no polling!)
- ✅ **Production ready** - scalable, secure, backed up
- ✅ **Free tier generous** - 500MB DB, 2GB bandwidth
- ✅ **Built-in analytics** - monitor queries, performance
- ✅ **Row Level Security** - secure by default

---

## 🧪 Testing

### **Test 1: Persistence**

1. Create reminder, click "Help to remind"
2. Check Supabase Dashboard → Table Editor → `pending_verifications`
3. Should see new row with status='pending'
4. Trigger Vercel redeploy
5. Check table again - row still there ✅

### **Test 2: Webhook Verification**

1. Create reminder, click "Help to remind"
2. Post on Farcaster/Warpcast
3. Check Supabase → Logs → Real-time logs
4. Should see UPDATE with status='verified' ✅

### **Test 3: Realtime Subscription**

1. Open browser console
2. Click "Help to remind"
3. Post on Farcaster
4. Should see instant update in console (< 1 second!) ✅
5. No polling logs

---

## 📊 Monitoring

**Supabase Dashboard provides:**
- Real-time database activity
- Query performance analytics
- API usage metrics
- Error logs
- Database size tracking

**Check:**
- Dashboard → Database → Tables → `pending_verifications`
- Dashboard → Logs → Postgres Logs
- Dashboard → API → API Logs

---

## 🔧 Maintenance

### **Cleanup Old Verifications**

Option 1: **Automatic (pg_cron)**
- Already configured in SQL setup
- Runs every 5 minutes automatically

Option 2: **Manual API endpoint**

Create `/api/admin/cleanup-verifications/route.ts`:
\`\`\`typescript
import { cleanupOldVerifications } from '@/lib/supabase/verification-service';
import { NextResponse } from 'next/server';

export async function POST() {
  const count = await cleanupOldVerifications(24);
  
  return NextResponse.json({
    success: true,
    removedCount: count,
  });
}
\`\`\`

Call manually:
\`\`\`bash
curl -X POST https://remindersbase.vercel.app/api/admin/cleanup-verifications
\`\`\`

---

## 🆘 Troubleshooting

### **Error: Missing Supabase environment variables**

**Fix:** Check `.env.local` and Vercel env vars:
\`\`\`bash
vercel env ls
\`\`\`

### **Error: Failed to connect to Supabase**

**Fix:** 
1. Check Supabase project is running (Dashboard → Settings)
2. Verify API keys are correct
3. Check network/firewall

### **Error: Row Level Security policy**

**Fix:** Disable RLS for testing:
\`\`\`sql
ALTER TABLE pending_verifications DISABLE ROW LEVEL SECURITY;
\`\`\`

Or update policies to allow service role access.

---

## 📚 Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript
- **Realtime**: https://supabase.com/docs/guides/realtime
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

---

## 🎯 Next Steps

After migration success:

1. ✅ Monitor Supabase dashboard for usage
2. ✅ Test webhook flow thoroughly
3. ✅ Enable Realtime subscriptions for better UX
4. ✅ Add database backups (automatic on paid plan)
5. ✅ Consider adding analytics table for tracking

---

**Migration Complete!** 🎉

Your verification system is now production-ready with persistent storage!
