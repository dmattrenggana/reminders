"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccount } from "wagmi";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">Create New Reminder</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Set a commitment with Base tokens.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">What is your commitment?</Label>
              <Textarea id="description" placeholder="e.g. Gym for 1 hour" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Stake Amount (Tokens)</Label>
              <Input id="amount" type="number" placeholder="100" />
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
              disabled={!address || loading}
              onClick={() => {
                // Logika transaksi Anda di sini
                onSuccess();
              }}
            >
              {address ? "Confirm Stake" : "Connect Wallet First"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
