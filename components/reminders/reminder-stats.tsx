"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, Flame, Lock, Loader2 } from "lucide-react"
import { useReminders } from "@/hooks/useReminders"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { useMemo } from "react"
import { TOKEN_SYMBOL } from "@/lib/contracts/config"

export function ReminderStats() {
  const { reminders, isLoading } = useReminders()
  const { balance } = useTokenBalance()

  const stats = useMemo(() => {
    const active = reminders.filter((r) => r.status === "active").length
    const completed = reminders.filter((r) => r.status === "completed").length
    const burned = reminders.filter((r) => r.status === "burned").length
    const tokensLocked = Math.floor(
      reminders
        .filter((r) => r.status === "active" || r.status === "pending")
        .reduce((sum, r) => sum + r.tokenAmount, 0),
    )

    return { active, completed, burned, tokensLocked }
  }, [reminders])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
          <p className="text-xs text-muted-foreground mt-1">Currently pending confirmation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{stats.completed}</div>
          <p className="text-xs text-muted-foreground mt-1">Successfully confirmed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Burned</CardTitle>
          <Flame className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.burned}</div>
          <p className="text-xs text-muted-foreground mt-1">Missed confirmations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokens Locked</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tokensLocked}</div>
          <p className="text-xs text-muted-foreground mt-1">{TOKEN_SYMBOL} currently staked</p>
        </CardContent>
      </Card>
    </div>
  )
}
