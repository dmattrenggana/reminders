"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { ConnectWalletButton } from "@/components/auth/connect-wallet-button"
import { ConnectFarcasterButton } from "@/components/auth/connect-farcaster-button"
import { ReminderDashboard } from "@/components/reminders/reminder-dashboard"
import { useAuth } from "@/lib/auth/auth-context"
import Image from "next/image"
import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

export default function HomePage() {
  const { isConnected, isFarcasterConnected, connectFarcaster } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      try {
        sdk.actions.ready()
      } catch (error) {
        console.error("Error initializing miniapp:", error)
      }
    }

    const frameContext = (window as any).farcasterFrameContext
    if (frameContext?.user && !isFarcasterConnected) {
      connectFarcaster()
    }
  }, [isFarcasterConnected, connectFarcaster])

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

            <div className="flex flex-col md:flex-row gap-1.5 md:gap-2 flex-shrink-0">
              <ConnectFarcasterButton />
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      <main>
        {isConnected && isFarcasterConnected ? (
          <ReminderDashboard />
        ) : (
          <AuthGuard requireWallet requireFarcaster>
            <ReminderDashboard />
          </AuthGuard>
        )}
      </main>
    </div>
  )
}
