import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/constants";

export function useReminders() {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveReminders = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      
      const nextId = await contract.nextId();
      const temp = [];

      // Loop untuk ambil data (dalam produksi, sebaiknya gunakan Subgraph/Indexer)
      for (let i = 0; i < Number(nextId); i++) {
        const r = await contract.reminders(i);
        // Hanya tampilkan jika belum selesai (isResolved == false)
        if (!r.isResolved) {
          temp.push({
            id: i,
            creator: r.creator,
            rewardPool: ethers.formatUnits(r.rewardPool, 18),
            deadline: Number(r.deadline),
            isCompleted: r.isCompleted
          });
        }
      }
      // Urutkan dari yang terbaru
      setActiveReminders(temp.reverse());
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActiveReminders(); }, []);

  return { activeReminders, loading, refresh: fetchActiveReminders };
}
