"use client"

import { ReminderCard } from "./reminder-card"
import { Clock, Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import { useReminders } from "@/hooks/useReminders"
import { CONTRACTS, validateContractConfig } from "@/lib/contracts/config"

export function ReminderList() {
  const { reminders, isLoading, error } = useReminders()

  // 1. Loading State (Tanpa dependensi Card UI)
  if (isLoading) {
    return (
      <div className="w-full p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-sm text-slate-500 font-medium">Loading your reminders...</p>
        </div>
      </div>
    )
  }

  // 2. Error State (Tanpa dependensi Alert UI)
  if (error) {
    const configCheck = validateContractConfig()

    return (
      <div className="space-y-4 p-6 bg-red-50 rounded-2xl border border-red-100 text-red-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-bold">Failed to load reminders</h3>
        </div>
        
        <div className="text-sm space-y-4">
          <p>{error}</p>

          {!configCheck.isValid && (
            <div className="p-3 bg-white/50 rounded-lg border border-red-200">
              <p className="font-bold mb-1 text-xs uppercase tracking-wider">Contract Issues:</p>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
                {configCheck.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-slate-800 rounded-lg text-slate-200 font-mono text-[10px] overflow-hidden">
            <p className="text-slate-400 mb-1">// Current Config</p>
            <p>TOKEN: {CONTRACTS.COMMIT_TOKEN || "MISSING"}</p>
            <p>VAULT: {CONTRACTS.REMINDER_VAULT || "MISSING"}</p>
          </div>

          <div className="pt-2 border-t border-red-200 flex items-center gap-2">
            <a
              href={`https://basescan.org/address/${CONTRACTS.REMINDER_VAULT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold underline flex items-center gap-1"
            >
              Check on Basescan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // 3. Empty State (Tanpa dependensi Card UI)
  if (!reminders || reminders.length === 0) {
    return (
      <div className="w-full p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No reminders yet</h3>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
            Create your first commitment to lock tokens and stay productive.
          </p>
        </div>
      </div>
    )
  }

  // 4. Success State
  return (
    <div className="grid gap-4">
      {reminders.map((reminder) => (
        <ReminderCard key={reminder.id} reminder={reminder} />
      ))}
    </div>
  )
}
