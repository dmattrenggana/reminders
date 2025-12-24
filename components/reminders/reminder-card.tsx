"use client"

import { useState, useMemo } from "react"
import { Clock, CheckCircle2, Flame, Lock, AlertCircle, Info, Coins, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAccount } from "wagmi"
import { useFarcaster } from "@/components/providers/farcaster-provider"
import { TOKEN_SYMBOL } from "@/lib/contracts/config"
import { useToast } from "@/components/ui/use-toast"

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
  const { address } = useAccount()
  const { user: providerUser, isMiniApp } = useFarcaster()
  const { toast } = useToast()

  // Calculate if reminder is in T-1 hour window (can be helped/confirmed)
  // T = reminderTime (deadline waktu yang di input ketika create reminder)
  // T-1 hour = 1 jam sebelum deadline (reminderTime - 3600)
  // Window: dari T-1 hour sampai confirmationDeadline (T+1 hour)
  const canInteract = useMemo(() => {
    if (reminder.isResolved) return false
    
    // T = reminderTime (deadline) - bisa dari reminderTime atau deadline field
    const now = Math.floor(Date.now() / 1000)
    
    // Try to get deadline from multiple possible fields
    let reminderTime: number
    if (reminder.deadline && typeof reminder.deadline === 'number') {
      reminderTime = reminder.deadline
    } else if (typeof reminder.reminderTime === 'number') {
      reminderTime = reminder.reminderTime
    } else if (reminder.reminderTime) {
      reminderTime = Math.floor(new Date(reminder.reminderTime).getTime() / 1000)
    } else {
      return false // No valid deadline found
    }
    
    // T-1 hour = 1 jam sebelum deadline
    const oneHourBefore = reminderTime - 3600 // T-1 hour
    
    // confirmationDeadline = T+1 hour (reminderTime + 1 hour)
    let confirmationDeadline: number
    if (reminder.confirmationDeadline) {
      confirmationDeadline = typeof reminder.confirmationDeadline === 'number'
        ? reminder.confirmationDeadline
        : Math.floor(new Date(reminder.confirmationDeadline).getTime() / 1000)
    } else {
      confirmationDeadline = reminderTime + 3600 // Default: T+1 hour
    }
    
    // Can interact from T-1 hour until confirmationDeadline
    const canInteractNow = now >= oneHourBefore && now <= confirmationDeadline
    
    // Debug logging (remove in production if needed)
    if (process.env.NODE_ENV === 'development') {
      console.log('[ReminderCard] T-1 hour check:', {
        reminderId: reminder.id,
        now,
        reminderTime,
        oneHourBefore,
        confirmationDeadline,
        canInteract: canInteractNow,
        timeUntilT1: oneHourBefore - now,
      })
    }
    
    return canInteractNow
  }, [reminder])

  // Format reminder time (deadline)
  const formattedTime = useMemo(() => {
    // Try to get deadline from multiple possible fields
    let deadlineTimestamp: number | null = null
    
    if (reminder.deadline && typeof reminder.deadline === 'number') {
      deadlineTimestamp = reminder.deadline
    } else if (typeof reminder.reminderTime === 'number') {
      deadlineTimestamp = reminder.reminderTime
    } else if (reminder.reminderTime) {
      deadlineTimestamp = Math.floor(new Date(reminder.reminderTime).getTime() / 1000)
    }
    
    if (!deadlineTimestamp) return "Unknown deadline"
    
    const date = new Date(deadlineTimestamp * 1000)
    
    try {
      // Format: "in 2 hours" or "2 hours ago"
      const relative = formatDistanceToNow(date, { addSuffix: true })
      // Also show absolute time for clarity
      const absolute = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      return `${relative} (${absolute})`
    } catch (error) {
      // Fallback to simple format
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }, [reminder.reminderTime, reminder.deadline])

  // Check if reminder is created by current user
  const isMyReminder = useMemo(() => {
    if (!address || !reminder.creator) return false
    return address.toLowerCase() === reminder.creator.toLowerCase()
  }, [address, reminder.creator])

  // Determine actual feed type (override if reminder is user's own)
  const actualFeedType = isMyReminder ? "my" : feedType

  const handleHelpRemindMe = async () => {
    if (onHelpRemind) {
      onHelpRemind(reminder);
    } else {
      toast({
        variant: "destructive",
        title: "Action Not Available",
        description: "Help remind functionality requires callback",
      });
    }
  }

  const handleConfirmReminder = async () => {
    // Debug: Log callback availability
    if (process.env.NODE_ENV === 'development') {
      console.log('[ReminderCard] handleConfirmReminder called:', {
        reminderId: reminder.id,
        hasOnConfirm: !!onConfirm,
        onConfirmType: typeof onConfirm,
        feedType: actualFeedType,
      });
    }
    
    if (!onConfirm) {
      console.error('[ReminderCard] onConfirm callback not available for reminder:', reminder.id);
      toast({
        variant: "destructive",
        title: "Action Not Available",
        description: "Confirm functionality requires callback. Please refresh the page.",
      });
      return;
    }
    
    setLoadingAction("confirm");
    try {
      await onConfirm(reminder.id);
    } catch (error: any) {
      console.error('[ReminderCard] Confirm reminder error:', error);
      toast({
        variant: "destructive",
        title: "Failed to Confirm",
        description: error.message || "Failed to confirm reminder",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  const getStatusConfig = () => {
    // Check if reminder is confirmed (completed)
    if (reminder.isResolved && reminder.isCompleted) {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: "Confirmed",
        color: "bg-green-50 text-green-700 border-green-100",
        iconColor: "text-green-600"
      }
    }
    // Check if reminder is burned (missed deadline)
    if (reminder.isResolved && !reminder.isCompleted) {
      return {
        icon: <Flame className="h-4 w-4" />,
        label: "Burned",
        color: "bg-red-50 text-red-700 border-red-100",
        iconColor: "text-red-600"
      }
    }
    // Removed "Danger Zone (T-1 Hour)" label - buttons are now active at T-1 hour
    if (reminder.isExpired) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Expired",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        iconColor: "text-gray-600"
      }
    }
    return {
      icon: <Clock className="h-4 w-4" />,
      label: "Active",
      color: "bg-blue-50 text-blue-700 border-blue-100",
      iconColor: "text-blue-600"
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="group bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-lg hover:border-[#4f46e5] transition-all overflow-hidden">
      {/* Header dengan status badge */}
      <div className="p-6 pb-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.color}`}>
            <span className={statusConfig.iconColor}>{statusConfig.icon}</span>
            {statusConfig.label}
          </div>
          
          {/* Feed type indicator */}
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            actualFeedType === "my" 
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}>
            {actualFeedType === "my" ? "My Task" : "Public"}
          </div>
        </div>

        {/* Description */}
        <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2">
          {reminder.description || "No description"}
        </h3>

        {/* Time and reward - Hide time if reminder is confirmed */}
        <div className="flex items-center justify-between text-xs">
          {!reminder.isResolved || !reminder.isCompleted ? (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-bold">{formattedTime}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-bold">Confirmed</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[#4f46e5] font-black">
            <Coins className="h-3.5 w-3.5" />
            <span>{reminder.rewardPool || reminder.tokenAmount || 0} {TOKEN_SYMBOL}</span>
          </div>
        </div>

        {/* Time Left Display */}
        {!reminder.isResolved && reminder.timeLeft !== undefined && (
          <div className={`mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold text-center ${
            reminder.isDangerZone 
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : reminder.isExpired
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {reminder.isExpired 
              ? "⏰ Expired" 
              : reminder.isDangerZone
                ? `⚡ ${Math.floor(reminder.timeLeft / 60)} mins left`
                : `⏳ ${Math.floor(reminder.timeLeft / 3600)}h ${Math.floor((reminder.timeLeft % 3600) / 60)}m left`
            }
          </div>
        )}
      </div>

      {/* Body - Action buttons */}
      <div className="p-6 pt-4 space-y-3">
        {/* Tombol Help Remind Me (untuk Public Feed) - Aktif di T-1 hour */}
        {actualFeedType === "public" && !reminder.isResolved && (
          <button
            onClick={handleHelpRemindMe}
            disabled={!canInteract || !!loadingAction || !address}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
              canInteract && !loadingAction && address
                ? "bg-[#4f46e5] hover:opacity-90 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loadingAction === "help" ? "Processing..." : (
              canInteract ? "Help to remind" : "Waiting to remind"
            )}
          </button>
        )}

        {/* Tombol Confirm Reminder (untuk My Feed) - Aktif di T-1 hour */}
        {actualFeedType === "my" && !reminder.isResolved && (
          <button
            onClick={handleConfirmReminder}
            disabled={!canInteract || !!loadingAction || !address}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
              canInteract && !loadingAction && address
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loadingAction === "confirm" ? "Processing..." : "Confirm Reminder"}
          </button>
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
