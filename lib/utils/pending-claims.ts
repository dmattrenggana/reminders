/**
 * Pending Claims Tracker
 * Manages pending reward claims that need to be retried
 */

export interface PendingClaim {
  reminderId: number;
  neynarScore: number;
  estimatedReward: string;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'pending_claims';
const MAX_RETRIES = 3;

/**
 * Add pending claim to local storage
 */
export function addPendingClaim(claim: Omit<PendingClaim, 'timestamp' | 'retries'>) {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getPendingClaims();
    const newClaim: PendingClaim = {
      ...claim,
      timestamp: Date.now(),
      retries: 0
    };
    
    // Check if already exists
    const index = existing.findIndex(c => c.reminderId === claim.reminderId);
    if (index >= 0) {
      existing[index] = newClaim;
    } else {
      existing.push(newClaim);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to add pending claim:', error);
  }
}

/**
 * Get all pending claims
 */
export function getPendingClaims(): PendingClaim[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const claims: PendingClaim[] = JSON.parse(stored);
    
    // Filter out old claims (older than 24 hours or max retries exceeded)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return claims.filter(c => 
      c.timestamp > oneDayAgo && 
      c.retries < MAX_RETRIES
    );
  } catch (error) {
    console.error('Failed to get pending claims:', error);
    return [];
  }
}

/**
 * Remove claim after successful processing
 */
export function removePendingClaim(reminderId: number) {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getPendingClaims();
    const filtered = existing.filter(c => c.reminderId !== reminderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending claim:', error);
  }
}

/**
 * Increment retry count
 */
export function incrementRetry(reminderId: number) {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getPendingClaims();
    const claim = existing.find(c => c.reminderId === reminderId);
    if (claim) {
      claim.retries += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (error) {
    console.error('Failed to increment retry:', error);
  }
}

/**
 * Check if has pending claims
 */
export function hasPendingClaims(): boolean {
  return getPendingClaims().length > 0;
}
