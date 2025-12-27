import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts/config";
import { executeRpcCall, batchRpcCalls } from "@/lib/utils/rpc-provider";

// Cache untuk mengurangi RPC calls - Optimized for QuickNode quota
const reminderCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds cache (balanced: prevents 429 errors but allows reasonable updates)
let globalFetchInProgress = false; // Prevent multiple simultaneous fetches

// Helper function to create stable reminder data with computed fields
function createReminderItem(r: any, nowTimestamp: number) {
  const timeLeft = r.deadline - nowTimestamp;
  const isDangerZone = !r.isResolved && timeLeft <= 3600 && timeLeft > 0;
  const isExpired = !r.isResolved && timeLeft <= 0;
  return {
    ...r,
    timeLeft,
    isDangerZone,
    isExpired,
  };
}

// Helper function to sort reminders by ID (descending - newest first)
function sortRemindersByNewest(reminders: any[]): any[] {
  return [...reminders].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
}

// Helper function to compare two reminder arrays for equality (by ID and key fields)
function areRemindersEqual(oldReminders: any[], newReminders: any[]): boolean {
  if (oldReminders.length !== newReminders.length) return false;
  
  // Create maps for quick lookup
  const oldMap = new Map(oldReminders.map(r => [r.id, r]));
  const newMap = new Map(newReminders.map(r => [r.id, r]));
  
  // Check if all IDs match
  if (oldMap.size !== newMap.size) return false;
  
  // Check each reminder for changes in key fields
  for (const [id, oldR] of oldMap) {
    const newR = newMap.get(id);
    if (!newR) return false;
    
    // Compare key fields that affect display
    if (
      oldR.isResolved !== newR.isResolved ||
      oldR.isCompleted !== newR.isCompleted ||
      oldR.rewardPool !== newR.rewardPool ||
      oldR.deadline !== newR.deadline ||
      oldR.description !== newR.description ||
      oldR.creator !== newR.creator
    ) {
      return false;
    }
  }
  
  return true;
}

export function useReminders() {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 30000; // Minimum 30 seconds between fetches (balanced: prevents rate limiting but allows updates)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<any[]>([]); // Store last set data to compare before updating

  const fetchReminders = useCallback(async (force = false) => {
    try {
      // Prevent multiple simultaneous fetches
      if (globalFetchInProgress) {
        console.log("[useReminders] Fetch already in progress, skipping...");
        return;
      }

      // Throttle: Don't fetch if last fetch was too recent (unless force refresh)
      const now = Date.now();
      if (!force && now - lastFetchRef.current < MIN_FETCH_INTERVAL && reminderCache.size > 0) {
        console.log("[useReminders] Throttled: Using cached data");
        // Update timeLeft for cached data without fetching
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const cachedItems = Array.from(reminderCache.values())
          .filter((cached) => now - cached.timestamp < CACHE_DURATION)
          .map((cached) => cached.data)
          .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
          .map((r: any) => createReminderItem(r, nowTimestamp));
        
        const sortedItems = sortRemindersByNewest(cachedItems);
        
        // Only update state if data actually changed
        if (!areRemindersEqual(lastDataRef.current, sortedItems)) {
          setActiveReminders(sortedItems);
          lastDataRef.current = sortedItems;
        }
        return;
      }
      lastFetchRef.current = now;
      globalFetchInProgress = true;

      setLoading(true);
      
      // Check if contract address is configured
      if (!VAULT_ADDRESS || VAULT_ADDRESS === "") {
        console.warn("Vault contract address not configured");
        setActiveReminders([]);
        setLoading(false);
        globalFetchInProgress = false;
        return;
      }

      // Fetch nextReminderId with retry and fallback
      const nextId = await executeRpcCall(async (provider) => {
        const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
        return await contract.nextReminderId();
      });
      
      const count = Number(nextId);
      const nowTimestamp = Math.floor(Date.now() / 1000);

      // Check cache for valid reminders
      const cachedReminders: any[] = [];
      const idsToFetch: number[] = [];

      for (let i = 0; i < count; i++) {
        const cached = reminderCache.get(i);
        if (cached && now - cached.timestamp < CACHE_DURATION) {
          cachedReminders.push(cached.data);
        } else {
          idsToFetch.push(i);
        }
      }

      // If all reminders are cached and fresh, use cache (unless force refresh)
      if (!force && idsToFetch.length === 0 && cachedReminders.length > 0) {
        console.log("[useReminders] Using cached data for all reminders");
        const items = cachedReminders
          .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
          .map((r: any) => createReminderItem(r, nowTimestamp));
        
        const sortedItems = sortRemindersByNewest(items);
        
        // Only update state if data actually changed
        if (!areRemindersEqual(lastDataRef.current, sortedItems)) {
          setActiveReminders(sortedItems);
          lastDataRef.current = sortedItems;
        }
        setLoading(false);
        globalFetchInProgress = false;
        return;
      }

      // Force refresh: clear cache if force is true
      if (force) {
        console.log("[useReminders] Force refresh: clearing cache and fetching all reminders");
        reminderCache.clear();
        // Rebuild idsToFetch with all reminders
        idsToFetch.length = 0;
        cachedReminders.length = 0;
        for (let i = 0; i < count; i++) {
          idsToFetch.push(i);
        }
      }

      // Batch fetch remaining reminders with rate limiting
      const fetchCalls = idsToFetch.map((id) => async (provider: ethers.JsonRpcProvider) => {
        const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
        try {
          const r = await contract.reminders(id);
          // Check if reminder exists (user is not zero address)
          if (r.user === ethers.ZeroAddress || !r.user) {
            return null;
          }
          
          console.log(`[useReminders] Reminder ${id} raw data:`, r);
          console.log(`[useReminders] Data type:`, typeof r, 'isArray:', Array.isArray(r), 'length:', r.length);
          
          // V5 contract returns struct that ethers parses as object with both named properties AND array indices
          // We can access via r.deadline or r[3]
          
          let reminderData: any;
          
          // V5 contract format only - use named properties
          console.log(`[useReminders] ✅ Using V5 format for reminder ${id}`);
          console.log(`[useReminders] V5 deadline value:`, r.deadline, 'type:', typeof r.deadline);
          
          const deadlineValue = Number(r.deadline);
          console.log(`[useReminders] V5 deadline converted to Number:`, deadlineValue);
          
          // V5: Determine isCompleted based on whether reminder was reclaimed (confirmed) or burned
          // Logic:
          // - reclaimReminder: Called by creator at T-1 hour (before deadline) → "Confirmed"
          // - burnMissedReminder: Called by cron job after deadline → "Burned"
          // Since V5 contract doesn't have separate 'confirmed' field, we use:
          // 1. rewardsClaimed > 0: If there are claimed rewards, it means helpers helped, so it was likely reclaimed (confirmed)
          // 2. Timing: If resolved and current time < deadline, it was likely reclaimed (confirmed)
          // 3. If resolved and rewardsClaimed = 0 and now >= deadline, it was likely burned
          const nowSeconds = Math.floor(Date.now() / 1000);
          const rewardsClaimedValue = Number(ethers.formatUnits(r.rewardsClaimed, 18));
          
          // If resolved and rewards were claimed, it was likely reclaimed (confirmed) - helpers got rewards
          // OR if resolved and current time is before deadline, it was reclaimed (confirmed) at T-1 hour
          // Otherwise, if resolved and no rewards claimed and deadline passed, it was burned
          const isCompleted = r.resolved && (rewardsClaimedValue > 0 || nowSeconds < deadlineValue);
          
          reminderData = {
            id: id,
            creator: r.user,
            rewardPool: ethers.formatUnits(r.rewardPoolAmount, 18),
            deadline: deadlineValue,
            reminderTime: deadlineValue, // V5: use deadline as reminderTime for compatibility
            isResolved: r.resolved,
            isCompleted: isCompleted, // V5: true if reclaimed (confirmed), false if burned
            description: r.description,
            farcasterUsername: r.farcasterUsername,
            commitAmount: ethers.formatUnits(r.commitAmount, 18),
            confirmationDeadline: deadlineValue, // V5: use deadline as confirmationDeadline too
            totalReminders: 0, // V5: no totalReminders field
            rewardsClaimed: ethers.formatUnits(r.rewardsClaimed, 18),
          };
          
          console.log(`[useReminders] Final reminderData for ${id}:`, reminderData);
          
          // Only cache valid data - use Date.now() (milliseconds) for cache timestamp
          reminderCache.set(id, { data: reminderData, timestamp: Date.now() });
          return reminderData;
        } catch (e: any) {
          // Silently skip errors for non-existent reminders
          if (!e.message?.includes("missing revert data") && !e.message?.includes("CALL_EXCEPTION")) {
            console.warn(`Error fetching reminder ID ${id}:`, e.message || e);
          }
          // Don't cache errors - return null
          return null;
        }
      });

      // Execute batch calls with improved settings for better connectivity
      const fetchedResults = await batchRpcCalls(fetchCalls, {
        batchSize: 10, // Increased from 5 to 10 for faster processing
        batchDelay: 100, // Reduced from 150ms to 100ms
        maxParallel: 5, // Increased from 3 to 5 for more concurrent requests
        maxRetries: 3, // Increased from 2 to 3 for better reliability
        retryDelay: 1000, // Increased from 500ms to 1000ms for stability
      });

      // Only update state if we got valid results
      const validFetchedResults = fetchedResults.filter((r) => r !== null && r.creator !== ethers.ZeroAddress);
      
      // Combine cached and fetched results
      const allResults = [...cachedReminders, ...validFetchedResults];

      // Only update state if we have valid data
      if (allResults.length > 0 || cachedReminders.length > 0) {
        // Filter data valid dan tambahkan metadata workflow
        const items = allResults
          .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
          .map((r: any) => createReminderItem(r, nowTimestamp));

        // Urutkan dari yang terbaru (ID terbesar di atas)
        const sortedItems = sortRemindersByNewest(items);
        console.log(`[useReminders] ✅ Fetched ${sortedItems.length} reminders, checking if update needed`);
        
        // Only update state if data actually changed
        if (!areRemindersEqual(lastDataRef.current, sortedItems)) {
          console.log(`[useReminders] Data changed, updating state`);
          setActiveReminders(sortedItems);
          lastDataRef.current = sortedItems;
        } else {
          console.log(`[useReminders] Data unchanged, skipping state update`);
        }
      } else {
        // No new data fetched, but update timeLeft for existing cached data
        const updatedItems = cachedReminders
          .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
          .map((r: any) => createReminderItem(r, nowTimestamp));
        
        const sortedItems = sortRemindersByNewest(updatedItems);
        
        if (sortedItems.length > 0) {
          console.log(`[useReminders] ✅ Updated ${sortedItems.length} cached reminders with fresh timeLeft`);
          // Only update if data actually changed
          if (!areRemindersEqual(lastDataRef.current, sortedItems)) {
            setActiveReminders(sortedItems);
            lastDataRef.current = sortedItems;
          }
        }
      }
      // If error but we have cached data, keep using cached data (don't clear)
    } catch (error: any) {
      console.warn("Could not fetch reminders from contract:", error?.message || error);
      // Don't clear state on error - keep existing data for stability
      // Only set empty if we have no cached data
      if (reminderCache.size === 0) {
        setActiveReminders([]);
        lastDataRef.current = [];
      } else {
        // Update timeLeft for cached data even on error
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const cachedItems = Array.from(reminderCache.values())
          .map((cached) => cached.data)
          .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
          .map((r: any) => createReminderItem(r, nowTimestamp));
        
        const sortedItems = sortRemindersByNewest(cachedItems);
        
        if (sortedItems.length > 0) {
          // Only update if data actually changed
          if (!areRemindersEqual(lastDataRef.current, sortedItems)) {
            setActiveReminders(sortedItems);
            lastDataRef.current = sortedItems;
          }
        }
      }
    } finally {
      setLoading(false);
      globalFetchInProgress = false;
    }
  }, []);

  // Real-time update for timeLeft without fetching (runs every 5 seconds for better UX)
  useEffect(() => {
    const updateTimeLeft = () => {
      // Always update timeLeft using functional setState to preserve current reminders
      const nowTimestamp = Math.floor(Date.now() / 1000);
      
      setActiveReminders((currentReminders: any[]) => {
        // If state is empty but cache has data, use cache
        if (currentReminders.length === 0 && reminderCache.size > 0) {
          const cachedItems = Array.from(reminderCache.values())
            .map((cached) => cached.data)
            .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
            .map((r: any) => createReminderItem(r, nowTimestamp));
          
          const sortedItems = sortRemindersByNewest(cachedItems);
          // Update ref
          if (sortedItems.length > 0) {
            lastDataRef.current = sortedItems;
            return sortedItems;
          }
          return currentReminders;
        }
        
        // Update timeLeft for current reminders (preserve all other data)
        // Only update timeLeft-related fields, keep all other data the same
        const updatedReminders = currentReminders.map((r: any) => {
          if (!r || !r.deadline) return r;
          return createReminderItem(r, nowTimestamp);
        });
        
        // Update ref for comparison (preserve sort order - already sorted)
        lastDataRef.current = updatedReminders;
        return updatedReminders;
      });
    };

    // Update timeLeft every 5 seconds for real-time countdown (reduced from 10s for better UX)
    const timeLeftInterval = setInterval(updateTimeLeft, 5000);

    return () => {
      clearInterval(timeLeftInterval);
    };
  }, []); // Empty deps - only run once on mount

  useEffect(() => {
    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Initial fetch with small delay to avoid race conditions
    fetchTimeoutRef.current = setTimeout(() => {
      fetchReminders();
    }, 100);
    
    // Refresh otomatis setiap 90 detik untuk mengupdate status (balanced: prevents 429 errors but keeps feed fresh)
    const interval = setInterval(() => {
      fetchReminders();
    }, 90000); // 90 seconds (balanced to prevent rate limiting while keeping feed updated)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      clearInterval(interval);
    };
  }, [fetchReminders]);

  // Wrapper function for refresh that forces a fetch (bypasses throttle)
  const refresh = useCallback(() => {
    fetchReminders(true);
  }, [fetchReminders]);

  return { activeReminders, loading, refresh };
}
