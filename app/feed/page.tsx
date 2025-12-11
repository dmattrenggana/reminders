"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Coins, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistance } from "date-fns"

interface PublicReminder {
  id: number
  user: string
  farcasterUsername: string
  description: string
  reminderTime: Date
  rewardPoolAmount: number
  totalReminders: number
  canRemind: boolean
}

export default function FeedPage() {
  const { walletAddress, farcasterUser } = useAuth()
  const [reminders, setReminders] = useState<PublicReminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPublicReminders()
  }, [])

  const loadPublicReminders = async () => {
    try {
      const response = await fetch("/api/reminders/public")
      const data = await response.json()
      setReminders(data.reminders)
    } catch (error) {
      console.error("Error loading public reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemind = async (reminder: PublicReminder) => {
    if (!farcasterUser) {
      alert("Please connect your Farcaster account first")
      return
    }

    try {
      // Generate post template
      const postText = `Hey @${reminder.farcasterUsername}! 🔔\n\nReminder: ${reminder.description}\n\nDon't forget to confirm before the deadline! ⏰\n\n#BaseReminders`

      // Open Warpcast with pre-filled text
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`
      window.open(warpcastUrl, "_blank")

      // Show claim dialog after posting
      setTimeout(() => {
        handleClaimReward(reminder.id)
      }, 3000)
    } catch (error) {
      console.error("Error creating reminder post:", error)
    }
  }

  const handleClaimReward = async (reminderId: number) => {
    if (!walletAddress || !farcasterUser) return

    try {
      const response = await fetch("/api/reminders/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderId,
          farcasterFid: farcasterUser.fid,
          walletAddress,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Reminder recorded! You can claim your reward after the user confirms.")
        loadPublicReminders()
      }
    } catch (error) {
      console.error("Error recording reminder:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reminders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Reminders
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Public Reminders Feed</h1>
        <p className="text-muted-foreground">
          Help others stay committed and earn rewards! Remind users via Farcaster to claim your share of the reward
          pool.
        </p>
      </div>

      <div className="grid gap-4">
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active reminders at the moment</p>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{reminder.description}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>@{reminder.farcasterUsername}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistance(reminder.reminderTime, new Date(), { addSuffix: true })}
                      </Badge>
                    </CardDescription>
                  </div>

                  {reminder.canRemind ? (
                    <Badge className="bg-green-500">Open</Badge>
                  ) : (
                    <Badge variant="secondary">Upcoming</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      <span>{reminder.rewardPoolAmount} RMND</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{reminder.totalReminders} reminded</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleRemind(reminder)}
                  disabled={!reminder.canRemind || !farcasterUser}
                  className="w-full"
                  size="sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {!farcasterUser
                    ? "Connect Farcaster to Remind"
                    : !reminder.canRemind
                      ? "Not in remind window yet"
                      : "Remind & Earn Rewards"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
