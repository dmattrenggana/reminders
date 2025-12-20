"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { VAULT_ADDRESS, VAULT_ABI } from "@/constants";

export function useReminders() {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Menggunakan Base Mainnet RPC
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

      const counter = await contract.reminderCounter();
      const items = [];

      // Loop untuk mengambil data dari mapping reminders di contract
      for (let i = 1; i <= Number(counter); i++) {
        const r = await contract.reminders(i);
        items.push({
          id: i,
          creator: r.creator,
          rewardPool: ethers.formatUnits(r.rewardPool, 18),
          deadline: Number(r.deadline),
          isResolved: r.isResolved,
          isCompleted: r.isCompleted,
        });
      }

      setActiveReminders(items);
    } catch (e) {
      console.error("Error fetching reminders:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activeReminders, loading, refresh };
}
