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
 * Create a new pending verification in Supabase
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
    throw new Error(`Failed to create verification: ${error.message}`);
  }

  console.log(`[Supabase] Created pending verification ${verification.id} for reminder ${data.reminderId}`);
  return verification as PendingVerification;
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

  return data as PendingVerification | null;
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
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error getting verification:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Auto-expire if needed
  if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
    const { error: updateError } = await supabase
      .from('pending_verifications')
      .update({ status: 'expired' })
      .eq('id', id);
    
    if (!updateError) {
      data.status = 'expired';
    }
  }

  return data as PendingVerification;
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
 * Get all pending verifications (for background processing)
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

  return (data as PendingVerification[]) || [];
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

  if (count && count > 0) {
    console.log(`[Supabase] Cleaned up ${count} old verifications`);
  }

  return count || 0;
}

