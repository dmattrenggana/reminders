"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { X, Bell, Coins } from "lucide-react";

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateReminderDialog({ open, onOpenChange, onSuccess }: CreateReminderDialogProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200">
        {/* Header Custom */}
        <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="font-bold">New Base Reminder</span>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="hover:bg-purple-700 p-1 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Input Deskripsi */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">What is your task?</label>
            <textarea 
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
              placeholder="e.g. Finish the smart contract integration..."
            />
          </div>
          
          {/* Input Amount */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              Stake Amount (Tokens)
            </label>
            <input 
              type="number"
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm font-mono"
              placeholder="100"
            />
          </div>

          {/* Action Button */}
          <button 
            disabled={!address || loading}
            onClick={() => {
              setLoading(true);
              // Simulasi sukses
              setTimeout(() => {
                setLoading(false);
                onSuccess();
              }, 1000);
            }}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
              !address || loading 
                ? "bg-slate-300 cursor-not-allowed" 
                : "bg-purple-600 hover:bg-purple-700 active:scale-[0.98]"
            }`}
          >
            {!address 
              ? "Wallet Not Connected" 
              : loading ? "Processing..." : "Confirm & Stake Tokens"}
          </button>
          
          <p className="text-[10px] text-center text-slate-400 italic">
            Tokens will be burned if the reminder is not confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
