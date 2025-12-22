import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/lib/contracts/config";

export function useReminders() {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if contract address is configured
      if (!VAULT_ADDRESS || VAULT_ADDRESS === "") {
        console.warn("Vault contract address not configured");
        setActiveReminders([]);
        return;
      }
      
      const rpcUrl = "https://mainnet.base.org"; 
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

      // Mengambil total ID yang ada (V4 uses nextReminderId)
      const nextId = await contract.nextReminderId();
      const count = Number(nextId);
      
      const now = Math.floor(Date.now() / 1000);

      // OPTIMASI: Membuat array promise untuk fetch data secara paralel
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(
          contract.reminders(i).then((r) => ({
            id: i,
            creator: r.user, // V4 uses 'user' not 'creator'
            rewardPool: ethers.formatUnits(r.rewardPoolAmount, 18), // V4 uses 'rewardPoolAmount'
            deadline: Number(r.reminderTime), // V4 uses 'reminderTime'
            isResolved: r.confirmed || r.burned, // V4: resolved if confirmed or burned
            isCompleted: r.confirmed, // V4: completed if confirmed
            description: r.description,
            farcasterUsername: r.farcasterUsername,
            commitAmount: ethers.formatUnits(r.commitAmount, 18),
            confirmationDeadline: Number(r.confirmationDeadline),
            totalReminders: Number(r.totalReminders),
            rewardsClaimed: ethers.formatUnits(r.rewardsClaimed, 18),
          })).catch(e => {
            console.error(`Error fetching ID ${i}:`, e);
            return null;
          })
        );
      }

      // Menjalankan semua request secara bersamaan
      const results = await Promise.all(promises);

      // Filter data valid dan tambahkan metadata workflow
      const items = results
        .filter((r) => r !== null && r.creator !== ethers.ZeroAddress)
        .map((r: any) => {
          const timeLeft = r.deadline - now;
          
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
    } catch (error: any) {
      console.warn("Could not fetch reminders from contract:", error?.message || error);
      // Set empty array on error - app continues to work
      setActiveReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    
    // Opsional: Refresh otomatis setiap 1 menit untuk mengupdate status Danger Zone
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  return { activeReminders, loading, refresh: fetchReminders };
}
