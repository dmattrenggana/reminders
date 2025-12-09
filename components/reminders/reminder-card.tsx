"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Flame, Lock, AlertCircle } from "lucide-react"
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
}

interface ReminderCardProps {
  reminder: Reminder
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
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
          </div>

          <div className="flex flex-col gap-2">
            {reminder.canConfirm && (
              <Button onClick={handleConfirm} size="lg" disabled={isConfirming}>
                {isConfirming ? "Confirming..." : "Confirm & Reclaim"}
              </Button>
            )}
            {reminder.status === "pending" && (
              <Button variant="outline" size="sm" disabled>
                Not Yet Available
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
