"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, CheckCircle2, Flame, Lock, AlertCircle, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useReminderService } from "@/hooks/use-reminder-service"
import { useToast } from "@/hooks/use-toast"
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
  canWithdrawUnclaimed?: boolean // Added for V3 withdraw feature
  canBurn?: boolean // Added canBurn flag
}

interface ReminderCardProps {
  reminder: Reminder
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false) // Added for V3 withdraw
  const [isBurning, setIsBurning] = useState(false) // Added burning state
  const service = useReminderService()
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!service) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setIsConfirming(true)

    try {
      console.log("[v0] Confirming reminder on blockchain:", reminder.id)
      await service.confirmReminder(reminder.id)

      toast({
        title: "Reminder Confirmed",
        description: `Successfully reclaimed ${reminder.tokenAmount} ${TOKEN_SYMBOL} tokens`,
      })

      // Trigger refresh (parent component should handle this)
      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Error confirming reminder:", error)
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm reminder",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleClaimReward = async () => {
    if (!service) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setIsClaiming(true)

    try {
      console.log("[v0] Claiming reward for reminder:", reminder.id)
      await service.claimReward(reminder.id)

      toast({
        title: "Reward Claimed",
        description: `Successfully claimed ${reminder.claimableReward || 0} ${TOKEN_SYMBOL} tokens`,
      })

      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Error claiming reward:", error)
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim reward",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  const handleWithdrawUnclaimed = async () => {
    if (!service) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setIsWithdrawing(true)

    try {
      console.log("[v0] Withdrawing unclaimed rewards for reminder:", reminder.id)
      await service.withdrawUnclaimedRewards(reminder.id)

      toast({
        title: "Unclaimed Rewards Withdrawn",
        description: `Successfully withdrawn ${reminder.unclaimedRewardPool || 0} ${TOKEN_SYMBOL} tokens`,
      })

      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Error withdrawing unclaimed rewards:", error)
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to withdraw unclaimed rewards",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleBurn = async () => {
    if (!service) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setIsBurning(true)

    try {
      console.log("[v0] Burning missed reminder:", reminder.id)
      await service.burnMissedReminder(reminder.id)

      toast({
        title: "Reminder Burned",
        description: `Commitment tokens burned. Reward pool of ${Math.floor(reminder.tokenAmount / 2)} ${TOKEN_SYMBOL} returned to you.`,
      })

      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Error burning reminder:", error)
      toast({
        title: "Burn Failed",
        description: error.message || "Failed to burn reminder",
        variant: "destructive",
      })
    } finally {
      setIsBurning(false)
    }
  }

  const getStatusConfig = () => {
    switch (reminder.status) {
      case "active":
        return {
          icon: AlertCircle,
          label: "Active",
          color: "text-primary bg-primary/10",
          urgent: Date.now() > reminder.reminderTime.getTime(),
        }
      case "pending":
        return {
          icon: Clock,
          label: "Pending",
          color: "text-muted-foreground bg-muted",
          urgent: false,
        }
      case "completed":
        return {
          icon: CheckCircle2,
          label: "Completed",
          color: "text-accent bg-accent/10",
          urgent: false,
        }
      case "burned":
        return {
          icon: Flame,
          label: "Burned",
          color: "text-destructive bg-destructive/10",
          urgent: false,
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Card className={cn("transition-all hover:shadow-md", statusConfig.urgent && "border-primary")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {statusConfig.urgent && (
                <Badge variant="destructive" className="animate-pulse">
                  Confirmation Needed
                </Badge>
              )}
            </div>

            <div>
              <p className="font-medium text-lg leading-tight text-balance">{reminder.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDistanceToNow(reminder.reminderTime, { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  {Math.floor(reminder.tokenAmount)} {TOKEN_SYMBOL}
                </span>
              </div>
            </div>

            {reminder.status === "active" && (
              <div className="text-xs text-muted-foreground">
                Deadline: {formatDistanceToNow(reminder.confirmationDeadline, { addSuffix: true })}
              </div>
            )}

            {reminder.canConfirm && reminder.totalHelpers === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important: No Helpers Yet</AlertTitle>
                <AlertDescription className="text-xs">
                  No one has reminded you yet. If you confirm now, you will get back{" "}
                  {Math.floor(reminder.tokenAmount / 2)} {TOKEN_SYMBOL} (50% commitment), but the other{" "}
                  {Math.floor(reminder.tokenAmount / 2)} {TOKEN_SYMBOL} (50% reward pool) will remain locked in the
                  contract.
                  <br />
                  <strong>
                    Consider waiting for helpers to remind you before confirming to maximize your recovery.
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            {reminder.status === "completed" && reminder.unclaimedRewardPool && reminder.unclaimedRewardPool > 0 && (
              <Alert variant={reminder.canWithdrawUnclaimed ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unclaimed Rewards</AlertTitle>
                <AlertDescription className="text-xs">
                  {Math.floor(reminder.unclaimedRewardPool)} {TOKEN_SYMBOL} from the reward pool remains unclaimed.
                  {reminder.canWithdrawUnclaimed ? (
                    <>
                      <br />
                      <strong>Good news!</strong> The 24-hour claim window has expired. You can now withdraw these
                      unclaimed tokens.
                    </>
                  ) : (
                    <>
                      <br />
                      Helpers have 24 hours from confirmation to claim their rewards. After that, you can withdraw the
                      unclaimed amount.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {reminder.canConfirm && (
              <Button onClick={handleConfirm} size="lg" disabled={isConfirming}>
                {isConfirming ? "Confirming..." : "Confirm & Reclaim"}
              </Button>
            )}
            {reminder.canClaim && reminder.claimableReward && reminder.claimableReward > 0 && (
              <Button onClick={handleClaimReward} variant="secondary" size="lg" disabled={isClaiming}>
                {isClaiming ? "Claiming..." : `Claim ${reminder.claimableReward} ${TOKEN_SYMBOL}`}
              </Button>
            )}
            {reminder.canBurn && (
              <Button onClick={handleBurn} variant="destructive" size="lg" disabled={isBurning}>
                {isBurning ? "Burning..." : "Burn Missed Reminder"}
              </Button>
            )}
            {reminder.status === "pending" && (
              <Button variant="outline" size="sm" disabled>
                Not Yet Available
              </Button>
            )}
            {reminder.canWithdrawUnclaimed && reminder.unclaimedRewardPool && reminder.unclaimedRewardPool > 0 && (
              <Button onClick={handleWithdrawUnclaimed} variant="default" size="lg" disabled={isWithdrawing}>
                {isWithdrawing
                  ? "Withdrawing..."
                  : `Withdraw ${Math.floor(reminder.unclaimedRewardPool)} ${TOKEN_SYMBOL}`}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
