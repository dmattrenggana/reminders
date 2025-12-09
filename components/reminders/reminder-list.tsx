"use client"

import { ReminderCard } from "./reminder-card"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2 } from "lucide-react"
import { useReminders } from "@/hooks/use-reminders"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ReminderList() {
  const { reminders, isLoading, error } = useReminders()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading your reminders...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load reminders: {error}</AlertDescription>
      </Alert>
    )
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No reminders yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create your first commitment-based reminder to get started. Lock tokens as stake and never miss what
              matters.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <ReminderCard key={reminder.id} reminder={reminder} />
      ))}
    </div>
  )
}
