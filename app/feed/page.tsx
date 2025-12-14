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
  const { walletAddress, farcasterUser, connectWallet } = useAuth()
  const [reminders, setReminders] = useState<PublicReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [processingReminder, setProcessingReminder] = useState<number | null>(null)
  const [isInMiniapp, setIsInMiniapp] = useState(false)
  const [frameSDK, setFrameSDK] = useState<any>(null)
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const searchParams = useSearchParams()

  useEffect(() => {
    const inFrame = typeof window !== "undefined" && window.self !== window.top
    const hasFrameSDK = typeof window !== "undefined" && (window as any).frameSDK !== undefined
    const isMiniapp = inFrame || hasFrameSDK
    setIsInMiniapp(isMiniapp)

    if (isMiniapp) {
      import("@farcaster/frame-sdk")
        .then((sdk) => {
          sdk.default.actions.ready().then(() => {
            setFrameSDK(sdk.default)
            console.log("[v0] Frame SDK initialized for transactions")
          })
        })
        .catch((err) => {
          console.error("[v0] Failed to load Frame SDK:", err)
        })
    }

    console.log("[v0] Running in Farcaster miniapp:", isMiniapp)
  }, [])

  useEffect(() => {
    console.log("[v0] AUTH STATE UPDATE:")
    console.log("[v0] - Farcaster User:", farcasterUser)
    console.log("[v0] - Wallet Address:", walletAddress)
    console.log("[v0] - Is in miniapp:", isInMiniapp)
  }, [farcasterUser, walletAddress, isInMiniapp])

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

  useEffect(() => {
    const pendingClaim = searchParams.get("claim")
    if (pendingClaim && walletAddress && farcasterUser) {
      const reminderId = Number.parseInt(pendingClaim)
      console.log("[v0] Detected pending claim from URL param:", reminderId)
      handleRecordReminder(reminderId)
    }
  }, [searchParams, walletAddress, farcasterUser])

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

  const handleRemindAndClaim = async (reminder: PublicReminder) => {
    console.log("[v0] =================================")
    console.log("[v0] BUTTON CLICKED - FULL STATE DEBUG")
    console.log("[v0] - Reminder ID:", reminder.id)
    console.log("[v0] - Is in miniapp:", isInMiniapp)
    console.log("[v0] - Farcaster user:", JSON.stringify(farcasterUser, null, 2))
    console.log("[v0] - Wallet address:", walletAddress)
    console.log("[v0] - Has farcasterUser:", !!farcasterUser)
    console.log("[v0] - Has walletAddress:", !!walletAddress)
    console.log("[v0] - FarcasterUser.walletAddress:", farcasterUser?.walletAddress)
    console.log("[v0] =================================")

    if (farcasterUser?.walletAddress && !walletAddress) {
      console.log("[v0] Found wallet in farcasterUser, but not in walletAddress state")
      console.log("[v0] Attempting to use Farcaster wallet:", farcasterUser.walletAddress)
    }

    if (isInMiniapp && !farcasterUser) {
      console.log("[v0] Waiting for Farcaster user to load in miniapp...")
      await new Promise((resolve) => setTimeout(resolve, 3000))

      if (!farcasterUser) {
        alert("Please refresh the app to connect your Farcaster account")
        return
      }
    }

    if (!farcasterUser) {
      alert("Please connect your Farcaster account first")
      return
    }

    if (!walletAddress) {
      const shouldConnect = confirm("To earn rewards, you need to connect your wallet. Connect now?")
      if (shouldConnect) {
        try {
          await connectWallet()
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          alert("Failed to connect wallet. Please try again.")
          return
        }
      } else {
        return
      }
    }

    try {
      console.log("[v0] Starting post and claim flow...")
      setProcessingReminder(reminder.id)

      const appUrl = "https://remindersbase.vercel.app"
      const returnUrl = `${appUrl}/feed?reminder=${reminder.id}&claim=${reminder.id}`
      const frameUrl = `${appUrl}/api/frame/${reminder.id}`

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

Help them stay accountable: ${returnUrl}`

      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}&embeds[]=${encodeURIComponent(frameUrl)}`

      console.log("[v0] Opening Warpcast compose with return URL:", returnUrl)

      window.location.href = warpcastUrl
    } catch (error) {
      console.error("Error in remind and claim flow:", error)
      setProcessingReminder(null)
      alert("Failed to initiate reminder process. Please try again.")
    }
  }

  const handleRecordReminder = async (reminderId: number) => {
    if (!farcasterUser) {
      console.log("[v0] Missing Farcaster user")
      return
    }

    try {
      setProcessingReminder(reminderId)

      const { ethers } = await import("ethers")

      if (isInMiniapp && frameSDK) {
        console.log("[v0] Using Frame SDK transact for transaction in miniapp")

        console.log("[v0] Fetching Neynar score for FID:", farcasterUser.fid)
        const scoreResponse = await fetch(`/api/neynar/score?fid=${farcasterUser.fid}`)
        const { score } = await scoreResponse.json()
        console.log("[v0] Neynar score:", score)

        const vaultInterface = new ethers.Interface(REMINDER_VAULT_V2_ABI)
        const calldata = vaultInterface.encodeFunctionData("recordReminder", [reminderId, score])

        console.log("[v0] Requesting transaction via Frame SDK transact...")
        console.log("[v0] Transaction params:", {
          chainId: "eip155:84532",
          method: "eth_sendTransaction",
          to: process.env.NEXT_PUBLIC_VAULT_CONTRACT,
          data: calldata,
          value: "0",
        })

        const result = await frameSDK.actions.transact({
          chainId: "eip155:84532",
          method: "eth_sendTransaction",
          params: {
            to: process.env.NEXT_PUBLIC_VAULT_CONTRACT!,
            value: "0",
            data: calldata,
          },
        })

        console.log("[v0] Frame SDK transact result:", result)

        if (result.transactionId) {
          console.log("[v0] Transaction submitted:", result.transactionId)
          alert(
            `✅ Reminder recorded and reward claimed!\n\nYour Neynar score: ${score}\n\nTransaction ID: ${result.transactionId}`,
          )
        } else {
          throw new Error("No transaction ID returned from Frame SDK")
        }
      } else {
        console.log("[v0] Using MetaMask for transaction")

        if (!window.ethereum) {
          alert("Please install MetaMask or connect a wallet")
          setProcessingReminder(null)
          return
        }

        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const vaultContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_CONTRACT!,
          REMINDER_VAULT_V2_ABI,
          signer,
        )

        console.log("[v0] Fetching Neynar score for FID:", farcasterUser.fid)
        const scoreResponse = await fetch(`/api/neynar/score?fid=${farcasterUser.fid}`)
        const { score } = await scoreResponse.json()

        console.log("[v0] Recording reminder with score:", score)
        const tx = await vaultContract.recordReminder(reminderId, score)
        console.log("[v0] Transaction sent:", tx.hash)

        const receipt = await tx.wait()
        console.log("[v0] Transaction confirmed:", receipt)

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
      }

      setProcessingReminder(null)
      loadPublicReminders()
    } catch (error) {
      console.error("[v0] Error recording reminder:", error)
      setProcessingReminder(null)
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
          Help others stay committed and earn rewards! Post a reminder on Farcaster to instantly claim your share.
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
            const isProcessing = processingReminder === reminder.id
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
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log("[v0] RAW BUTTON CLICK EVENT FIRED!")
                          handleRemindAndClaim(reminder)
                        }}
                        disabled={isProcessing}
                        className="flex-1 cursor-pointer !pointer-events-auto"
                        size="sm"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Post & Claim Reward
                          </>
                        )}
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
