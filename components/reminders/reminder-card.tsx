"use client"

import { useState } from "react"
import { Clock, CheckCircle2, Flame, Lock, AlertCircle, Info, Coins } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useReminderService } from "@/hooks/use-reminder-service"
import { TOKEN_SYMBOL } from "@/lib/contracts/config"

interface Reminder {
  id: number
  description: string
  tokenAmount: number
  reminderTime: Date
  confirmationDeadline: Date
  status: "pending" | "active" | "completed" | "burned"
  canConfirm: boolean
  canClaim?: boolean
  claimableReward?: number
  totalHelpers?: number
  unclaimedRewardPool?: number
  canWithdrawUnclaimed?: boolean
  canBurn?: boolean
}

interface ReminderCardProps {
  reminder: Reminder
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const service = useReminderService()

  const handleAction = async (actionType: string, actionFn: () => Promise<void>, successMsg: string) => {
    if (!service) {
      alert("Please connect your wallet first")
      return
    }
    setLoadingAction(actionType)
    try {
      await actionFn()
      alert(successMsg)
      window.location.reload()
    } catch (error: any) {
      console.error(`Error during ${actionType}:`, error)
      alert(error.message || `Failed to ${actionType}`)
    } finally {
      setLoadingAction(null)
    }
  }

  const getStatusConfig = () => {
    switch (reminder.status) {
      case "active":
        return { icon: AlertCircle, label: "Active", color: "bg-purple-100 text-purple-700", border: "border-purple-200" }
      case "pending":
        return { icon: Clock, label: "Waiting", color: "bg-slate-100 text-slate-600", border: "border-slate-200" }
      case "completed":
        return { icon: CheckCircle2, label: "Done", color: "bg-green-100 text-green-700", border: "border-green-200" }
      case "burned":
        return { icon: Flame, label: "Burned", color: "bg-red-100 text-red-700", border: "border-red-200" }
      default:
        return { icon: Info, label: "Unknown", color: "bg-slate-100 text-slate-600", border: "border-slate-200" }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  return (
    <div className={`bg-white rounded-2xl border ${config.border} p-5 shadow-sm space-y-4 transition-all`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
            {reminder.canConfirm && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse uppercase tracking-wider">
                Action Required
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 leading-tight">{reminder.description}</h3>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-purple-600 font-bold">
            <Coins className="h-4 w-4" />
            <span>{Math.floor(reminder.tokenAmount)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{TOKEN_SYMBOL} STAKED</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50">
        <div className="space-y-0.5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target Time</p>
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(reminder.reminderTime), { addSuffix: true })}
          </p>
        </div>
        {reminder.status === "active" && (
          <div className="space-y-0.5 text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Deadline</p>
            <p className="text-xs font-semibold text-red-500">
              {formatDistanceToNow(new Date(reminder.confirmationDeadline), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="flex flex-col gap-2 pt-2">
        {reminder.canConfirm && (
          <button
            onClick={() => handleAction("confirm", () => service.confirmReminder(reminder.id), "Success! Stake reclaimed.")}
            disabled={!!loadingAction}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loadingAction === "confirm" ? "Processing..." : "Confirm & Reclaim Stake"}
          </button>
        )}

        {reminder.canBurn && (
          <button
            onClick={() => handleAction("burn", () => service.burnMissedReminder(reminder.id), "Reminder burned successfully.")}
            disabled={!!loadingAction}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loadingAction === "burn" ? "Burning..." : "Burn Missed Reminder"}
          </button>
        )}

        {reminder.canWithdrawUnclaimed && (
          <button
            onClick={() => handleAction("withdraw", () => service.withdrawUnclaimedRewards(reminder.id), "Rewards withdrawn.")}
            disabled={!!loadingAction}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loadingAction === "withdraw" ? "Withdrawing..." : `Withdraw Unclaimed ${TOKEN_SYMBOL}`}
          </button>
        )}

        {reminder.status === "pending" && (
          <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-center border border-slate-100 text-sm italic">
            Waiting for reminder time...
          </div>
        )}
      </div>
    </div>
  )
}
