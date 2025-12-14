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
import { useAuth } from "@/lib/auth/auth-context"
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
  const [showManualTime, setShowManualTime] = useState(false)
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")
  const [txStatus, setTxStatus] = useState<string>("")

  const service = useReminderService()
  const { balance } = useTokenBalance()
  const { toast } = useToast()
  const { farcasterUser } = useAuth()

  const setQuickReminder = (hoursFromNow: number) => {
    const now = new Date()
    const reminderTime = addHours(now, hoursFromNow)

    setDate(new Date(reminderTime.getFullYear(), reminderTime.getMonth(), reminderTime.getDate()))
    const hrs = String(reminderTime.getHours()).padStart(2, "0")
    const mins = String(reminderTime.getMinutes()).padStart(2, "0")
    setTime(`${hrs}:${mins}`)
    setHours(hrs)
    setMinutes(mins)
  }

  const handleManualTimeChange = (newHours: string, newMinutes: string) => {
    setHours(newHours)
    setMinutes(newMinutes)
    if (newHours && newMinutes) {
      setTime(`${newHours.padStart(2, "0")}:${newMinutes.padStart(2, "0")}`)
    }
  }

  const handleCreate = async () => {
    console.log("[v0] ===== DIALOG: Starting handleCreate =====")
    setTxStatus("Checking fields...")

    if (!description || !tokenAmount || !date || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      setTxStatus("")
      return
    }

    if (!service) {
      console.error("[v0] DIALOG: Service not available")
      toast({
        title: "Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      setTxStatus("")
      return
    }

    if (Number.parseInt(balance) < Number.parseInt(tokenAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${tokenAmount} ${TOKEN_SYMBOL} tokens. Current balance: ${balance} ${TOKEN_SYMBOL}`,
        variant: "destructive",
      })
      setTxStatus("")
      return
    }

    console.log("[v0] DIALOG: All validation passed, setting isCreating to true")
    setIsCreating(true)
    setTxStatus("Preparing transaction...")

    try {
      const reminderDate = new Date(date)
      reminderDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      console.log("[v0] DIALOG: Prepared reminder date:", reminderDate.toISOString())
      console.log("[v0] DIALOG: Token amount:", tokenAmount)
      console.log("[v0] DIALOG: Description:", description)
      console.log("[v0] DIALOG: Farcaster username:", farcasterUser?.username || "none")

      console.log("[v0] DIALOG: Calling service.createReminder...")

      const reminderId = await service.createReminder(
        tokenAmount,
        reminderDate,
        description,
        farcasterUser?.username,
        (status) => {
          console.log("[v0] DIALOG: Progress update:", status)
          setTxStatus(status)
        },
      )

      console.log("[v0] DIALOG: ✅ Reminder created successfully! ID:", reminderId)
      setTxStatus("✅ Reminder created!")

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
      setHours("")
      setMinutes("")

      setTimeout(() => {
        setTxStatus("")
        onOpenChange(false)
      }, 2000)

      console.log("[v0] DIALOG: ===== DIALOG: handleCreate completed successfully =====")
    } catch (error: any) {
      console.error("[v0] DIALOG: ❌❌ Error in handleCreate:", error)
      console.error("[v0] DIALOG: Error name:", error.name)
      console.error("[v0] DIALOG: Error message:", error.message)
      console.error("[v0] DIALOG: Error stack:", error.stack)
      console.error("[v0] DIALOG: Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))

      setTxStatus("")
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] DIALOG: Finally block - setting isCreating to false")
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
              <div className="flex items-center justify-between">
                <Label htmlFor="time">Reminder Time</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setShowManualTime(!showManualTime)}
                >
                  {showManualTime ? "Use Picker" : "Manual Entry"}
                </Button>
              </div>

              {showManualTime ? (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="HH"
                      value={hours}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || (Number(val) >= 0 && Number(val) <= 23)) {
                          handleManualTimeChange(val, minutes)
                        }
                      }}
                      min="0"
                      max="23"
                      className="text-center"
                    />
                  </div>
                  <span className="text-muted-foreground">:</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="MM"
                      value={minutes}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) {
                          handleManualTimeChange(hours, val)
                        }
                      }}
                      min="0"
                      max="59"
                      className="text-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value)
                      const [h, m] = e.target.value.split(":")
                      setHours(h)
                      setMinutes(m)
                    }}
                    className="pl-10 h-10 cursor-pointer"
                    style={{ WebkitAppearance: "none" }}
                  />
                </div>
              )}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isCreating}>
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

        {txStatus && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-center">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{txStatus}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
