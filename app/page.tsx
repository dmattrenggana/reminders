"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { UnifiedConnectButton } from "@/components/auth/unified-connect-button"
import { ReminderDashboard } from "@/components/reminders/reminder-dashboard"
import { useAuth } from "@/lib/auth/auth-context"
import Image from "next/image"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { isConnected, isFarcasterConnected } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      const initFrameSDK = async () => {
        try {
          // Import Frame SDK dynamically
          const sdk = await import("@farcaster/frame-sdk")

          // Call ready to dismiss splash screen
          await sdk.default.actions.ready()
          console.log("[v0] Frame SDK ready called successfully")
        } catch (error) {
          console.error("[v0] Error calling Frame SDK ready:", error)

          // Fallback: send frame-ready message to parent
          try {
            window.parent.postMessage({ type: "frame-ready" }, "*")
          } catch (postError) {
            console.log("[v0] Could not notify parent frame")
          }
        }
      }

      initFrameSDK()
    }
  }, [])

  const isAuthenticated = isConnected || isFarcasterConnected

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-[#4A90E2] flex items-center justify-center flex-shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Base Reminders Logo"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Base Reminders</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Never Miss What Matters</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Link href="/feed">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Public Feed
                  </Button>
                </Link>
              )}
              <UnifiedConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main>
        {isAuthenticated ? (
          <ReminderDashboard />
        ) : (
          <AuthGuard requireWallet={false} requireFarcaster={false}>
            <ReminderDashboard />
          </AuthGuard>
        )}
      </main>
    </div>
  )
}
