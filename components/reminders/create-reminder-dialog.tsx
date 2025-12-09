"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReminderService } from "@/hooks/use-reminder-service"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { useToast } from "@/hooks/use-toast"
import { TOKEN_SYMBOL } from "@/lib/contracts/config"
import { addHours, startOfDay, startOfToday } from "date-fns"

interface CreateReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateReminderDialog({ open, onOpenChange, onSuccess }: CreateReminderDialogProps) {
  const [description, setDescription] = useState("")
  const [tokenAmount, setTokenAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const service = useReminderService()
  const { balance } = useTokenBalance()
  const { toast } = useToast()

  const setQuickReminder = (hoursFromNow: number) => {
    const now = new Date()
    const reminderTime = addHours(now, hoursFromNow)

    setDate(new Date(reminderTime.getFullYear(), reminderTime.getMonth(), reminderTime.getDate()))
    const hours = String(reminderTime.getHours()).padStart(2, "0")
    const minutes = String(reminderTime.getMinutes()).padStart(2, "0")
    setTime(`${hours}:${minutes}`)
  }

  const handleCreate = async () => {
    if (!description || !tokenAmount || !date || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!service) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (Number.parseInt(balance) < Number.parseInt(tokenAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${tokenAmount} ${TOKEN_SYMBOL} tokens. Current balance: ${balance} ${TOKEN_SYMBOL}`,
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const [hours, minutes] = time.split(":").map(Number)
      const reminderDate = new Date(date)
      reminderDate.setHours(hours, minutes, 0, 0)

      console.log("[v0] Creating reminder on blockchain...")
      const reminderId = await service.createReminder(tokenAmount, reminderDate, description)

      console.log("[v0] Reminder created with ID:", reminderId)

      toast({
        title: "Reminder Created",
        description: `Your reminder has been created with ${tokenAmount} ${TOKEN_SYMBOL} locked`,
      })

      onSuccess()

      // Reset form
      setDescription("")
      setTokenAmount("")
      setDate(undefined)
      setTime("")
    } catch (error: any) {
      console.error("[v0] Error creating reminder:", error)
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Reminder</DialogTitle>
          <DialogDescription>
            Lock tokens as commitment. You can reclaim them by confirming the reminder on time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">What do you want to remember?</Label>
            <Textarea
              id="description"
              placeholder="e.g., Submit project proposal, Call dentist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenAmount">Token Commitment ({TOKEN_SYMBOL})</Label>
            <Input
              id="tokenAmount"
              type="number"
              placeholder="0"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              min="0"
              step="1"
            />
            <p className="text-xs text-muted-foreground">
              Your balance: {balance} {TOKEN_SYMBOL}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Quick Set</Label>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setQuickReminder(1)} className="text-xs">
                +1 Hour
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickReminder(2)} className="text-xs">
                +2 Hours
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickReminder(3)} className="text-xs">
                +3 Hours
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickReminder(4)} className="text-xs">
                +4 Hours
              </Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Reminder Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => startOfDay(date) < startOfToday()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Reminder Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="text-sm font-medium">Confirmation Window</h4>
            <p className="text-xs text-muted-foreground">
              Notifications start 1 hour before your reminder time and repeat every 10 minutes. You have until 1 hour
              after the reminder time to confirm, or your tokens will be burned.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !description || !tokenAmount || !date || !time}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Reminder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
