/**
 * In-memory storage for pending verifications
 * Used to match incoming webhook events with pending verification requests
 */

export interface PendingVerification {
  id: string; // UUID token
  reminderId: number;
  helperFid: number;
  helperAddress: string;
  creatorUsername: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'verified' | 'expired';
  verifiedAt?: Date;
  neynarScore?: number;
  estimatedReward?: string;
  webhookReceivedAt?: Date;
}

// In-memory Map storage (key: verification token ID)
const pendingVerifications = new Map<string, PendingVerification>();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanupExpiredEntries() {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [id, verification] of pendingVerifications.entries()) {
    if (verification.expiresAt < now && verification.status === 'pending') {
      verification.status = 'expired';
      cleanedCount++;
    }
    
    // Remove expired entries older than 1 hour
    if (verification.expiresAt < new Date(now.getTime() - 60 * 60 * 1000)) {
      pendingVerifications.delete(id);
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[PendingVerifications] Cleaned up ${cleanedCount} expired entries`);
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

/**
 * Generate UUID (Node.js compatible)
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a new pending verification
 */
export function createPendingVerification(data: {
  reminderId: number;
  helperFid: number;
  helperAddress: string;
  creatorUsername: string;
  expiresInMinutes?: number; // Default: 10 minutes
}): PendingVerification {
  const id = generateUUID();
  const now = new Date();
  const expiresIn = (data.expiresInMinutes || 10) * 60 * 1000;
  
  const verification: PendingVerification = {
    id,
    reminderId: data.reminderId,
    helperFid: data.helperFid,
    helperAddress: data.helperAddress.toLowerCase(),
    creatorUsername: data.creatorUsername,
    createdAt: now,
    expiresAt: new Date(now.getTime() + expiresIn),
    status: 'pending',
  };
  
  pendingVerifications.set(id, verification);
  console.log(`[PendingVerifications] Created pending verification ${id} for reminder ${data.reminderId}, helper FID ${data.helperFid}`);
  
  return verification;
}

/**
 * Find pending verification by helper FID and reminder ID
 */
export function findPendingVerification(
  helperFid: number,
  reminderId: number
): PendingVerification | undefined {
  for (const verification of pendingVerifications.values()) {
    if (
      verification.helperFid === helperFid &&
      verification.reminderId === reminderId &&
      verification.status === 'pending' &&
      verification.expiresAt > new Date()
    ) {
      return verification;
    }
  }
  return undefined;
}

/**
 * Get pending verification by token ID
 */
export function getPendingVerificationById(id: string): PendingVerification | undefined {
  const verification = pendingVerifications.get(id);
  
  // Check if expired
  if (verification && verification.expiresAt < new Date() && verification.status === 'pending') {
    verification.status = 'expired';
  }
  
  return verification;
}

/**
 * Mark verification as verified
 */
export function markVerificationAsVerified(
  id: string,
  data: {
    neynarScore: number;
    estimatedReward: string;
  }
): boolean {
  const verification = pendingVerifications.get(id);
  
  if (!verification) {
    console.warn(`[PendingVerifications] Verification ${id} not found`);
    return false;
  }
  
  if (verification.status !== 'pending') {
    console.warn(`[PendingVerifications] Verification ${id} is not pending (status: ${verification.status})`);
    return false;
  }
  
  if (verification.expiresAt < new Date()) {
    verification.status = 'expired';
    console.warn(`[PendingVerifications] Verification ${id} has expired`);
    return false;
  }
  
  verification.status = 'verified';
  verification.verifiedAt = new Date();
  verification.neynarScore = data.neynarScore;
  verification.estimatedReward = data.estimatedReward;
  verification.webhookReceivedAt = new Date();
  
  console.log(`[PendingVerifications] ✅ Marked verification ${id} as verified`);
  return true;
}

/**
 * Get all pending verifications (for debugging/admin)
 */
export function getAllPendingVerifications(): PendingVerification[] {
  return Array.from(pendingVerifications.values());
}

/**
 * Remove verification (after processing)
 */
export function removeVerification(id: string): boolean {
  return pendingVerifications.delete(id);
}

/**
 * Clean up old verifications (for maintenance)
 */
export function cleanupOldVerifications(maxAgeHours: number = 24): number {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  let removedCount = 0;
  
  for (const [id, verification] of pendingVerifications.entries()) {
    if (verification.createdAt < cutoff) {
      pendingVerifications.delete(id);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`[PendingVerifications] Cleaned up ${removedCount} old verifications (older than ${maxAgeHours}h)`);
  }
  
  return removedCount;
}

