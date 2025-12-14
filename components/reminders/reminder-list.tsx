"use client"

import { ReminderCard } from "./reminder-card"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2, AlertTriangle } from "lucide-react"
import { useReminders } from "@/hooks/use-reminders"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CONTRACTS, validateContractConfig } from "@/lib/contracts/config"

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
    const configCheck = validateContractConfig()

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load reminders</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{error}</p>

            {!configCheck.isValid && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                <p className="font-semibold mb-2">Contract Configuration Issues:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {configCheck.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="font-semibold mb-2">Current Configuration:</p>
              <div className="space-y-1 text-sm font-mono">
                <p>Token: {CONTRACTS.COMMIT_TOKEN || "(not set)"}</p>
                <p>Vault: {CONTRACTS.REMINDER_VAULT || "(not set)"}</p>
              </div>
            </div>

            <p className="text-sm mt-4">
              Please verify your contract addresses are correct and deployed on Base Mainnet (Chain ID: 8453).
              <br />
              You can check them on{" "}
              <a
                href={`https://basescan.org/address/${CONTRACTS.REMINDER_VAULT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Basescan
              </a>
              .
            </p>
          </AlertDescription>
        </Alert>
      </div>
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
