"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Coins, Users, ArrowLeft, CheckCircle } from "lucide-react"
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
  hasRecorded: boolean
}

export default function FeedPage() {
  const { walletAddress, farcasterUser } = useAuth()
  const [reminders, setReminders] = useState<PublicReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [postedReminders, setPostedReminders] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadPublicReminders()
  }, [walletAddress])

  const loadPublicReminders = async () => {
    try {
      const url = walletAddress ? `/api/reminders/public?walletAddress=${walletAddress}` : "/api/reminders/public"
      const response = await fetch(url)
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const reminderUrl = `${appUrl}/feed?reminder=${reminder.id}`

      const postText = `Hey @${reminder.farcasterUsername}! 🔔\n\nReminder: ${reminder.description}\n\nDon't forget to confirm before the deadline! ⏰\n\n${reminderUrl}\n\n#BaseReminders`
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`
      window.open(warpcastUrl, "_blank")
      setPostedReminders((prev) => new Set(prev).add(reminder.id))
      alert(
        "After you've posted on Farcaster, click 'Record & Claim' to record your reminder on-chain and earn rewards!",
      )
    } catch (error) {
      console.error("Error creating reminder post:", error)
    }
  }

  const handleRecordReminder = async (reminderId: number) => {
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
        alert(
          `✅ Reminder recorded and reward claimed!\n\nYour Neynar score: ${data.neynarScore}\nReward received: ${data.rewardAmount} COMMIT tokens\n\nTransaction: ${data.txHash}`,
        )
        setPostedReminders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(reminderId)
          return newSet
        })
        loadPublicReminders()
      } else {
        alert(`Failed to record: ${data.error}`)
      }
    } catch (error) {
      console.error("Error recording reminder:", error)
      alert("Failed to record reminder on-chain")
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
          reminders.map((reminder) => {
            const hasPosted = postedReminders.has(reminder.id)
            const alreadyRecorded = reminder.hasRecorded

            return (
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

                  <div className="flex gap-2">
                    {alreadyRecorded ? (
                      <Button disabled variant="outline" className="flex-1 bg-transparent" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Already Recorded & Claimed
                      </Button>
                    ) : !hasPosted ? (
                      <Button
                        onClick={() => handleRemind(reminder)}
                        disabled={!reminder.canRemind || !farcasterUser}
                        className="flex-1"
                        size="sm"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {!farcasterUser
                          ? "Connect Farcaster to Remind"
                          : !reminder.canRemind
                            ? "Not in remind window yet"
                            : "Post Reminder on Farcaster"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRecordReminder(reminder.id)}
                        variant="default"
                        className="flex-1"
                        size="sm"
                      >
                        Record & Claim Rewards
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
