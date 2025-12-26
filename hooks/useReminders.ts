import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts/config";
import { executeRpcCall, batchRpcCalls } from "@/lib/utils/rpc-provider";

// Cache untuk mengurangi RPC calls - Optimized for QuickNode quota
const reminderCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 300 seconds cache (5 minutes - increased to save quota)
let globalFetchInProgress = false; // Prevent multiple simultaneous fetches

export function useReminders() {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 60000; // Minimum 60 seconds between fetches (increased to save quota)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const cachedItems = Array.from(reminderCache.values())
          .filter((cached) => now - cached.timestamp < CACHE_DURATION)
          .map((cached) => cached.data)
          .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
          .map((r: any) => {
            const timeLeft = r.deadline - Math.floor(Date.now() / 1000);
            const isDangerZone = !r.isResolved && timeLeft <= 3600 && timeLeft > 0;
            const isExpired = !r.isResolved && timeLeft <= 0;
            return { ...r, timeLeft, isDangerZone, isExpired };
          });
        if (cachedItems.length > 0) {
          setActiveReminders(cachedItems.reverse());
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
          .map((r: any) => {
            const timeLeft = r.deadline - nowTimestamp;
            const isDangerZone = !r.isResolved && timeLeft <= 3600 && timeLeft > 0;
            const isExpired = !r.isResolved && timeLeft <= 0;
            return { ...r, timeLeft, isDangerZone, isExpired };
          });
        setActiveReminders(items.reverse());
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
          
          // Check if this is V5 format by checking for 'deadline' property (V5) vs 'reminderTime' property (V3/V4)
          const isV5 = r.deadline !== undefined && r.reminderTime === undefined;
          
          if (isV5) {
            // V5 format - use named properties
            console.log(`[useReminders] ✅ Detected V5 format for reminder ${id}`);
            console.log(`[useReminders] V5 deadline value:`, r.deadline, 'type:', typeof r.deadline);
            
            const deadlineValue = Number(r.deadline);
            console.log(`[useReminders] V5 deadline converted to Number:`, deadlineValue);
            
            // V5: Determine isCompleted based on whether reminder was reclaimed (confirmed) or burned
            // Since V5 contract doesn't have separate 'confirmed' field, we infer from rewards:
            // - If resolved = true and rewardsClaimed < rewardPoolAmount, it was likely reclaimed (confirmed) at T-1 hour
            //   (reclaimReminder returns 30% + unclaimed rewards, so some rewards may remain unclaimed)
            // - If resolved = true and rewardsClaimed >= rewardPoolAmount, it was likely burned after deadline
            //   (burnMissedReminder burns 30% and returns unclaimed rewards, so rewardsClaimed should be close to rewardPoolAmount)
            const rewardPoolAmount = Number(ethers.formatUnits(r.rewardPoolAmount, 18));
            const rewardsClaimed = Number(ethers.formatUnits(r.rewardsClaimed, 18));
            // If resolved and there are still unclaimed rewards (rewardsClaimed < rewardPoolAmount), it's likely confirmed (reclaimed)
            // This is because reclaimReminder returns unclaimed portion, so some helpers may not have claimed yet
            const isCompleted = r.resolved && rewardsClaimed < rewardPoolAmount;
            
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
          } else {
            // V3/V4 format (backward compatibility) - use named properties
            console.log(`[useReminders] ✅ Detected V3/V4 format for reminder ${id}`);
            reminderData = {
              id: id,
              creator: r.user,
              rewardPool: ethers.formatUnits(r.rewardPoolAmount, 18),
              deadline: Number(r.reminderTime),
              reminderTime: Number(r.reminderTime),
              isResolved: r.confirmed || r.burned,
              isCompleted: r.confirmed,
              description: r.description,
              farcasterUsername: r.farcasterUsername,
              commitAmount: ethers.formatUnits(r.commitAmount, 18),
              confirmationDeadline: Number(r.confirmationDeadline),
              totalReminders: Number(r.totalReminders),
              rewardsClaimed: ethers.formatUnits(r.rewardsClaimed, 18),
            };
          }
          
          console.log(`[useReminders] Final reminderData for ${id}:`, reminderData);
          
          // Only cache valid data
          reminderCache.set(id, { data: reminderData, timestamp: now });
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
          .map((r: any) => {
            const timeLeft = r.deadline - nowTimestamp;
            
            // Logika Workflow: Danger Zone adalah -1 jam (3600 detik) sebelum deadline
            const isDangerZone = !r.isResolved && timeLeft <= 3600 && timeLeft > 0;
            
            // Logika Workflow: Expired jika deadline lewat tapi belum resolved
            const isExpired = !r.isResolved && timeLeft <= 0;

            return {
              ...r,
              timeLeft,
              isDangerZone,
              isExpired,
            };
          });

        // Urutkan dari yang terbaru (ID terbesar di atas)
        setActiveReminders(items.reverse());
      }
      // If error but we have cached data, keep using cached data (don't clear)
    } catch (error: any) {
      console.warn("Could not fetch reminders from contract:", error?.message || error);
      // Don't clear state on error - keep existing data for stability
      // Only set empty if we have no cached data
      if (reminderCache.size === 0) {
        setActiveReminders([]);
      }
    } finally {
      setLoading(false);
      globalFetchInProgress = false;
    }
  }, []);

  useEffect(() => {
    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Initial fetch with small delay to avoid race conditions
    fetchTimeoutRef.current = setTimeout(() => {
      fetchReminders();
    }, 100);
    
    // Refresh otomatis setiap 5 menit untuk mengupdate status (optimized for quota)
    const interval = setInterval(() => {
      fetchReminders();
    }, 300000); // 5 minutes (increased to save QuickNode quota)

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
