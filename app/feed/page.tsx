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

        console.log("[v0] Requesting transaction via Frame SDK...")
        console.log("[v0] Transaction details:", {
          to: process.env.NEXT_PUBLIC_VAULT_CONTRACT,
          value: "0",
          data: calldata,
        })

        try {
          const result = await frameSDK.actions.transact({
            chainId: `eip155:84532`, // Base Sepolia
            method: "eth_sendTransaction",
            params: {
              abi: REMINDER_VAULT_V2_ABI,
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

            setProcessingReminder(null)
            loadPublicReminders()
            return
          } else {
            throw new Error("No transaction ID returned from Frame SDK")
          }
        } catch (frameError: any) {
          console.error("[v0] Frame SDK transact error:", frameError)

          alert("Frame SDK transaction failed. The app will attempt to connect your wallet for the transaction.")

          // Request wallet connection
          if (!window.ethereum) {
            throw new Error("Please connect a wallet to complete this transaction")
          }

          // Fall through to MetaMask flow below
        }
      }

      console.log("[v0] Using MetaMask/Web3 wallet for transaction")

      if (!window.ethereum) {
        alert("Please install MetaMask or connect a wallet")
        setProcessingReminder(null)
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const vaultContract = new ethers.Contract(process.env.NEXT_PUBLIC_VAULT_CONTRACT!, REMINDER_VAULT_V2_ABI, signer)

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 py-4 max-w-2xl sm:px-4 sm:py-8 sm:max-w-4xl">
        <div className="mb-3 sm:mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 px-2 sm:h-10 sm:px-4">
              <ArrowLeft className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Back</span>
            </Button>
          </Link>
        </div>

        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Public Reminders Feed</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Help others stay committed and earn rewards!</p>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {reminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No active reminders at the moment</p>
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
                  <CardHeader className="pb-2 sm:pb-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-lg mb-1 truncate">{reminder.description}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <span className="truncate max-w-[120px] sm:max-w-none">{reminder.farcasterUsername}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5 shrink-0"
                          >
                            <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            {formatDistance(reminder.reminderTime, new Date(), { addSuffix: true })}
                          </Badge>
                        </CardDescription>
                      </div>

                      {reminder.canRemind ? (
                        <Badge className="bg-green-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 shrink-0">
                          Open
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 shrink-0"
                        >
                          Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{reminder.rewardPoolAmount} RMND</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{reminder.totalReminders} reminded</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {alreadyRecorded ? (
                        <Button
                          disabled
                          variant="outline"
                          className="flex-1 bg-transparent text-xs sm:text-sm h-8 sm:h-10"
                          size="sm"
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Claimed
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log("[v0] Button clicked for reminder:", reminder.id)
                            handleRemindAndClaim(reminder)
                          }}
                          disabled={isProcessing}
                          className="flex-1 cursor-pointer text-xs sm:text-sm h-8 sm:h-10 touch-manipulation"
                          size="sm"
                          style={{ pointerEvents: "auto" }}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Post & Claim
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
    </div>
  )
}
