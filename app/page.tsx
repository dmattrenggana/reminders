"use client"

import { useEffect } from "react"
import sdk from "@farcaster/frame-sdk"
import { UnifiedConnectButton } from "@/components/auth/unified-connect-button"
import { ReminderDashboard } from "@/components/reminders/reminder-dashboard"
import { useAuth } from "@/lib/auth/auth-context"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Shield, Coins, Users } from "-react"

export default function HomePage() {
  const { isConnected, isFarcasterConnected } = useAuth()

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error("Farcaster SDK Error:", error);
      }
    };
    init();
  }, []);

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
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="space-y-8">
              <div className="text-center space-y-4 py-12">
                <h2 className="text-4xl font-bold tracking-tight">Commitment-Based Reminders on Base</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Set reminders with token stakes. Complete them on time or lose your tokens to reward pool.
                </p>
                <div className="pt-4">
                  <UnifiedConnectButton />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Dashboard Preview</h3>
                    <p className="text-sm text-muted-foreground mt-1">See what you'll get when you connect</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-6 border-2 border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Reminders</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-2 border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-2 border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Coins className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tokens Staked</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-8 border-2 border-dashed">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Your Reminders Will Appear Here</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        Connect your wallet or Farcaster account to start creating commitment-based reminders
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
