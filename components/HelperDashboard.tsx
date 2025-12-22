import { useReminders } from "@/hooks/useReminders";
import { useEffect, useState } from "react";

export default function HelperDashboard() {
  const { activeReminders, loading, refresh } = useReminders();
  const [sdk, setSdk] = useState<any>(null);

  // Load miniapp SDK dynamically if in miniapp environment
  useEffect(() => {
    const loadSDK = async () => {
      if (typeof window !== 'undefined' && 'Farcaster' in window) {
        try {
          const { sdk: miniappSdk } = await import("@farcaster/miniapp-sdk");
          setSdk(miniappSdk);
        } catch (error) {
          console.warn("Failed to load Farcaster miniapp SDK:", error);
        }
      }
    };
    loadSDK();
  }, []);

  const handleShareMention = (creatorAddress: string) => {
    // Fungsi untuk membuka composer Farcaster otomatis
    // Catatan: Idealnya Anda menyimpan username creator di DB atau mapping address->username
    const text = `Hey @farcaster_user (Creator), don't forget your task! #VaultReminder`;
    
    if (sdk?.actions?.openUrl) {
      sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`);
    } else {
      // Fallback untuk web browser
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat Target...</div>;

  return (
    <div className="flex flex-col p-4 bg-gray-50 min-h-screen pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-purple-900">Helper Board</h1>
        <button onClick={refresh} className="text-xs bg-white border px-3 py-1 rounded-md shadow-sm">Refresh</button>
      </div>

      <div className="space-y-4">
        {activeReminders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-400">Belum ada target pengingat aktif.</p>
          </div>
        ) : (
          activeReminders.map((reminder) => (
            <div key={reminder.id} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase">
                    ID #{reminder.id}
                  </span>
                  <p className="text-sm font-medium mt-1">
                    Creator: {reminder.creator.slice(0, 6)}...{reminder.creator.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-green-600 leading-none">
                    {reminder.rewardPool} <span className="text-xs font-normal">RMND</span>
                  </p>
                  <p className="text-[10px] text-gray-400">Total Reward Pool</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleShareMention(reminder.creator)}
                  className="flex-1 bg-purple-600 text-white text-sm font-bold py-2 rounded-xl active:scale-95 transition-transform"
                >
                  Remind Now (Mention)
                </button>
                <button 
                  onClick={() => {/* Trigger Claim Function dari useVault */}}
                  className="px-4 bg-green-50 text-green-700 text-sm font-bold py-2 rounded-xl active:scale-95 border border-green-200"
                >
                  Claim
                </button>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 mt-2">
                Batas Waktu: {new Date(reminder.deadline * 1000).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
