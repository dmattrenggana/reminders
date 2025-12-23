"use client"

import { useState, useMemo } from "react"
import { Clock, CheckCircle2, Flame, Lock, AlertCircle, Info, Coins, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useReminderService } from "@/hooks/use-reminder-service"
import { useAccount } from "wagmi"
import { useFarcaster } from "@/components/providers/farcaster-provider"
import { TOKEN_SYMBOL } from "@/lib/contracts/config"

interface Reminder {
  id: number
  description: string
  tokenAmount: number
  reminderTime: Date | number
  confirmationDeadline?: Date | number
  deadline?: number
  status?: "pending" | "active" | "completed" | "burned"
  canConfirm?: boolean
  canClaim?: boolean
  claimableReward?: number
  totalHelpers?: number
  unclaimedRewardPool?: number
  canWithdrawUnclaimed?: boolean
  canBurn?: boolean
  creator?: string
  isResolved?: boolean
  isCompleted?: boolean
  isDangerZone?: boolean
  isExpired?: boolean
  timeLeft?: number
  rewardPool?: string
}

interface ReminderCardProps {
  reminder: Reminder
  feedType?: "public" | "my"
  onHelpRemind?: (reminder: Reminder) => void
  onConfirm?: (reminderId: number) => void
}

export function ReminderCard({ reminder, feedType = "public", onHelpRemind, onConfirm }: ReminderCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const service = useReminderService()
  const { address } = useAccount()
  const { user: providerUser, isMiniApp } = useFarcaster()

  // Calculate if reminder is in T-1 hour window (can be helped/confirmed)
  const canInteract = useMemo(() => {
    if (reminder.isResolved) return false
    
    const now = Math.floor(Date.now() / 1000)
    
    // Get reminderTime in seconds
    let reminderTime = 0
    if (reminder.deadline) {
      reminderTime = typeof reminder.deadline === 'number' ? reminder.deadline : 0
    } else if (reminder.reminderTime) {
      if (reminder.reminderTime instanceof Date) {
        reminderTime = Math.floor(reminder.reminderTime.getTime() / 1000)
      } else if (typeof reminder.reminderTime === 'number') {
        // Check if it's in seconds or milliseconds
        reminderTime = reminder.reminderTime > 1e12 
          ? Math.floor(reminder.reminderTime / 1000) 
          : reminder.reminderTime
      }
    }
    
    if (!reminderTime) return false
    
    // T-1 hour window: from (reminderTime - 3600) to confirmationDeadline
    const oneHourBefore = reminderTime - 3600
    
    // Get confirmationDeadline in seconds
    let confirmationDeadline = reminderTime + 3600 // Default 1 hour after reminderTime
    if (reminder.confirmationDeadline) {
      if (reminder.confirmationDeadline instanceof Date) {
        confirmationDeadline = Math.floor(reminder.confirmationDeadline.getTime() / 1000)
      } else if (typeof reminder.confirmationDeadline === 'number') {
        confirmationDeadline = reminder.confirmationDeadline > 1e12 
          ? Math.floor(reminder.confirmationDeadline / 1000) 
          : reminder.confirmationDeadline
      }
    }
    
    return now >= oneHourBefore && now <= confirmationDeadline
  }, [reminder])

  // Check if this is user's own reminder
  const isMyReminder = useMemo(() => {
    if (!address || !reminder.creator) return false
    return reminder.creator.toLowerCase() === address.toLowerCase()
  }, [address, reminder.creator])

  // Determine actual feed type (override if reminder is user's own)
  const actualFeedType = isMyReminder ? "my" : feedType

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

  const handleHelpRemindMe = async () => {
    if (!onHelpRemind) {
      // Fallback to service if no callback provided
      if (!service) {
        alert("Please connect your wallet first")
        return
      }
      setLoadingAction("help")
      try {
        // This would need to be implemented in service
        alert("Help remind functionality - please implement")
      } catch (error: any) {
        alert(error.message || "Failed to help remind")
      } finally {
        setLoadingAction(null)
      }
    } else {
      onHelpRemind(reminder)
    }
  }

  const handleConfirmReminder = async () => {
    if (onConfirm) {
      setLoadingAction("confirm")
      try {
        await onConfirm(reminder.id)
      } catch (error: any) {
        alert(error.message || "Failed to confirm reminder")
      } finally {
        setLoadingAction(null)
      }
    } else if (service) {
      handleAction("confirm", () => service!.confirmReminder(reminder.id), "Success! Stake reclaimed.")
    }
  }

  const getStatusConfig = () => {
    if (reminder.isResolved && reminder.isCompleted) {
      return { icon: CheckCircle2, label: "Completed", color: "bg-green-100 text-green-700", border: "border-green-200" }
    }
    if (reminder.isResolved && !reminder.isCompleted) {
      return { icon: Flame, label: "Burned", color: "bg-red-100 text-red-700", border: "border-red-200" }
    }
    if (reminder.isDangerZone) {
      return { icon: AlertCircle, label: "Active", color: "bg-purple-100 text-purple-700", border: "border-purple-200" }
    }
    if (reminder.isExpired) {
      return { icon: Flame, label: "Expired", color: "bg-red-100 text-red-700", border: "border-red-200" }
    }
    return { icon: Clock, label: "Waiting", color: "bg-slate-100 text-slate-600", border: "border-slate-200" }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  // Get reminder time for display
  const reminderTimeDate = useMemo(() => {
    if (reminder.reminderTime instanceof Date) return reminder.reminderTime
    if (typeof reminder.reminderTime === 'number') {
      // Check if it's in seconds or milliseconds
      return new Date(reminder.reminderTime > 1e12 ? reminder.reminderTime : reminder.reminderTime * 1000)
    }
    if (reminder.deadline) {
      return new Date(reminder.deadline * 1000)
    }
    return new Date()
  }, [reminder.reminderTime, reminder.deadline])

  // Get token amount for display
  const tokenAmount = reminder.tokenAmount || Number(reminder.rewardPool || 0) || 0

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
            <span>{Math.floor(tokenAmount)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{TOKEN_SYMBOL} STAKED</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50">
        <div className="space-y-0.5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target Time</p>
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {(() => {
              try {
                if (isNaN(reminderTimeDate.getTime())) {
                  return "Invalid date";
                }
                return formatDistanceToNow(reminderTimeDate, { addSuffix: true });
              } catch (error) {
                console.error("[ReminderCard] Error formatting reminderTime:", error, reminder);
                return "Invalid date";
              }
            })()}
          </p>
        </div>
        {reminder.confirmationDeadline && !reminder.isResolved && (
          <div className="space-y-0.5 text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Deadline</p>
            <p className="text-xs font-semibold text-red-500">
              {(() => {
                try {
                  const deadlineDate = reminder.confirmationDeadline instanceof Date 
                    ? reminder.confirmationDeadline 
                    : new Date(typeof reminder.confirmationDeadline === 'number' 
                        ? (reminder.confirmationDeadline > 1e12 ? reminder.confirmationDeadline : reminder.confirmationDeadline * 1000)
                        : Date.now());
                  if (isNaN(deadlineDate.getTime())) {
                    return "Invalid date";
                  }
                  return formatDistanceToNow(deadlineDate, { addSuffix: true });
                } catch (error) {
                  console.error("[ReminderCard] Error formatting confirmationDeadline:", error, reminder);
                  return "Invalid date";
                }
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="flex flex-col gap-2 pt-2">
        {/* Public Feed: Help Remind Me button */}
        {actualFeedType === "public" && !reminder.isResolved && (
          <button
            onClick={handleHelpRemindMe}
            disabled={!canInteract || !!loadingAction || !address}
            className={`
              w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95
              ${canInteract && address
                ? "bg-[#4f46e5] hover:bg-[#4338ca] text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }
              disabled:opacity-50
            `}
          >
            {loadingAction === "help" ? (
              "Processing..."
            ) : canInteract ? (
              <>
                <Bell className="inline h-4 w-4 mr-2" />
                Help Remind Me
              </>
            ) : (
              "Help Remind Me (Available T-1 hour)"
            )}
          </button>
        )}

        {/* My Feed: Confirm Reminder button */}
        {actualFeedType === "my" && !reminder.isResolved && (
          <button
            onClick={handleConfirmReminder}
            disabled={!canInteract || !!loadingAction || !address}
            className={`
              w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95
              ${canInteract && address
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }
              disabled:opacity-50
            `}
          >
            {loadingAction === "confirm" ? (
              "Processing..."
            ) : canInteract ? (
              "Confirm Reminder"
            ) : (
              "Confirm Reminder (Available T-1 hour)"
            )}
          </button>
        )}

        {/* Legacy: Tombol Confirm (for backward compatibility) */}
        {reminder.canConfirm && service && actualFeedType !== "my" && (
          <button
            onClick={() => handleAction("confirm", () => service!.confirmReminder(reminder.id), "Success! Stake reclaimed.")}
            disabled={!!loadingAction}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loadingAction === "confirm" ? "Processing..." : "Confirm & Reclaim Stake"}
          </button>
        )}

        {/* Tombol Burn */}
        {reminder.canBurn && service && (
          <button
            onClick={() => handleAction("burn", () => service!.burnMissedReminder(reminder.id), "Reminder burned successfully.")}
            disabled={!!loadingAction}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loadingAction === "burn" ? "Burning..." : "Burn Missed Reminder"}
          </button>
        )}

        {/* Tombol Withdraw Unclaimed */}
        {reminder.canWithdrawUnclaimed && service && (
          <button
            onClick={() => handleAction("withdraw", () => service!.withdrawUnclaimedRewards(reminder.id), "Rewards withdrawn.")}
            disabled={!!loadingAction}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loadingAction === "withdraw" ? "Withdrawing..." : `Withdraw Unclaimed ${TOKEN_SYMBOL}`}
          </button>
        )}

        {/* Status Menunggu - sebelum T-1 hour */}
        {!reminder.isResolved && !canInteract && actualFeedType === "my" && (
          <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-center border border-slate-100 text-sm italic">
            Waiting for reminder time (T-1 hour)...
          </div>
        )}

        {!reminder.isResolved && !canInteract && actualFeedType === "public" && (
          <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-center border border-slate-100 text-sm italic">
            Help available at T-1 hour before reminder
          </div>
        )}

        {/* Fallback jika dompet belum konek */}
        {!address && !reminder.isResolved && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
             <p className="text-[10px] text-amber-700 font-bold uppercase">Wallet Not Connected</p>
             <p className="text-[9px] text-amber-600">Please connect to interact with this reminder</p>
          </div>
        )}
      </div>
    </div>
  )
}
