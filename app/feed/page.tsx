"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Coins, Users, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { formatDistance } from "date-fns"
import { useSearchParams } from "next/navigation"
import { REMINDER_VAULT_V2_ABI } from "@/lib/contracts/config"

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
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const searchParams = useSearchParams()

  useEffect(() => {
    loadPublicReminders()
  }, [walletAddress])

  useEffect(() => {
    const reminderIdParam = searchParams.get("reminder")
    if (reminderIdParam && reminders.length > 0) {
      const reminderId = Number.parseInt(reminderIdParam)
      setTimeout(() => {
        const element = cardRefs.current[reminderId]
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          element.classList.add("ring-2", "ring-primary", "ring-offset-2")
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2")
          }, 3000)
        }
      }, 500)
    }
  }, [reminders, searchParams])

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
      const appUrl = "https://remindersbase.vercel.app"
      const reminderUrl = `${appUrl}/feed?reminder=${reminder.id}`

      const timeStr = new Date(reminder.reminderTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })

      const userIdentifier =
        reminder.farcasterUsername && !reminder.farcasterUsername.startsWith("0x")
          ? `@${reminder.farcasterUsername}`
          : reminder.farcasterUsername

      const postText = `Hey ${userIdentifier}! Don't forget: ${reminder.description}

Reminder time: ${timeStr}
Reward pool: ${reminder.rewardPoolAmount} COMMIT tokens

Help them stay accountable: ${reminderUrl}`

      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`

      console.log("[v0] Post text:", postText)
      console.log("[v0] Reminder URL:", reminderUrl)
      console.log("[v0] Reminder ID:", reminder.id)
      console.log("[v0] Full reminder object:", reminder)

      window.open(warpcastUrl, "_blank")
      setPostedReminders((prev) => new Set(prev).add(reminder.id))
      alert(
        "After you've posted on Farcaster, click 'Record & Claim' to record your reminder on-chain and earn rewards instantly!",
      )
    } catch (error) {
      console.error("Error creating reminder post:", error)
    }
  }

  const handleRecordReminder = async (reminderId: number) => {
    if (!walletAddress || !farcasterUser) return

    try {
      const { ethers } = await import("ethers")

      if (!window.ethereum) {
        alert("Please install MetaMask or connect a wallet")
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const vaultContract = new ethers.Contract(process.env.NEXT_PUBLIC_VAULT_CONTRACT!, REMINDER_VAULT_V2_ABI, signer)

      // Get Neynar score first
      const scoreResponse = await fetch(`/api/neynar/score?fid=${farcasterUser.fid}`)
      const { score } = await scoreResponse.json()

      console.log("[v0] Recording reminder with score:", score)

      const tx = await vaultContract.recordReminder(reminderId, score)
      console.log("[v0] Transaction sent:", tx.hash)

      const receipt = await tx.wait()
      console.log("[v0] Transaction confirmed:", receipt)

      // Parse event to get reward amount
      const rewardClaimedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = vaultContract.interface.parseLog(log)
          return parsed?.name === "RewardClaimed"
        } catch {
          return false
        }
      })

      let rewardAmount = 0
      if (rewardClaimedEvent) {
        const parsed = vaultContract.interface.parseLog(rewardClaimedEvent)
        rewardAmount = parsed?.args?.amount ? Number(ethers.formatEther(parsed.args.amount)) : 0
      }

      alert(
        `✅ Reminder recorded and reward claimed!\n\nYour Neynar score: ${score}\nReward received: ${rewardAmount} COMMIT tokens\n\nTransaction: ${tx.hash}`,
      )

      setPostedReminders((prev) => {
        const newSet = new Set(prev)
        newSet.delete(reminderId)
        return newSet
      })
      loadPublicReminders()
    } catch (error) {
      console.error("[v0] Error recording reminder:", error)
      alert(`Failed to record reminder: ${error instanceof Error ? error.message : "Unknown error"}`)
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
              <Card
                key={reminder.id}
                ref={(el) => {
                  cardRefs.current[reminder.id] = el
                }}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{reminder.description}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{reminder.farcasterUsername}</span>
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
