import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/constants";

export function useReminders() {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Gunakan RPC Public Base agar data terbaca di web biasa
      const rpcUrl = "https://mainnet.base.org"; 
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

      // Sesuai ABI Anda: menggunakan nextId
      const nextId = await contract.nextId();
      const count = Number(nextId);
      
      const items = [];

      for (let i = 0; i < count; i++) {
        try {
          const r = await contract.reminders(i);
          if (r.creator !== ethers.ZeroAddress) {
            items.push({
              id: i,
              creator: r.creator,
              rewardPool: ethers.formatUnits(r.rewardPool, 18),
              deadline: Number(r.deadline),
              isResolved: r.isResolved,
              isCompleted: r.isCompleted,
            });
          }
        } catch (e) {
          console.error(`Error fetching ID ${i}:`, e);
        }
      }

      setActiveReminders(items.reverse());
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { activeReminders, loading, refresh: fetchReminders };
}
