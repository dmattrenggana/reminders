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

  const fetchReminders = useCallback(async () => {
    try {
      // Prevent multiple simultaneous fetches
      if (globalFetchInProgress) {
        console.log("[useReminders] Fetch already in progress, skipping...");
        return;
      }

      // Throttle: Don't fetch if last fetch was too recent
      const now = Date.now();
      if (now - lastFetchRef.current < MIN_FETCH_INTERVAL && reminderCache.size > 0) {
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

      // If all reminders are cached and fresh, use cache
      if (idsToFetch.length === 0 && cachedReminders.length > 0) {
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
        return;
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
          const reminderData = {
            id: id,
            creator: r.user,
            rewardPool: ethers.formatUnits(r.rewardPoolAmount, 18),
            deadline: Number(r.reminderTime),
            isResolved: r.confirmed || r.burned,
            isCompleted: r.confirmed,
            description: r.description,
            farcasterUsername: r.farcasterUsername,
            commitAmount: ethers.formatUnits(r.commitAmount, 18),
            confirmationDeadline: Number(r.confirmationDeadline),
            totalReminders: Number(r.totalReminders),
            rewardsClaimed: ethers.formatUnits(r.rewardsClaimed, 18),
          };
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

      // Execute batch calls with rate limiting - Optimized for responsiveness
      const fetchedResults = await batchRpcCalls(fetchCalls, {
        batchSize: 3, // Process 3 reminders at a time (increased for responsiveness)
        batchDelay: 300, // 300ms delay between batches (reduced for responsiveness)
        maxRetries: 2, // 2 retries for reliability
        retryDelay: 500, // Reduced retry delay for responsiveness
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

  return { activeReminders, loading, refresh: fetchReminders };
}
