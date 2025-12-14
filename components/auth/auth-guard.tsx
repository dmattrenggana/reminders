"use client"

import type React from "react"

import { useAuth } from "@/lib/auth/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectWalletButton } from "./connect-wallet-button"
import { ConnectFarcasterButton } from "./connect-farcaster-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireWallet?: boolean
  requireFarcaster?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireWallet = true, requireFarcaster = false, redirectTo }: AuthGuardProps) {
  const { isConnected, isFarcasterConnected, chainId } = useAuth()
  const router = useRouter()

  const isAuthenticated = (!requireWallet || isConnected) && (!requireFarcaster || isFarcasterConnected)

  useEffect(() => {
    if (!isAuthenticated && redirectTo) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router])

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect to Continue</CardTitle>
            <CardDescription>Please connect your wallet and Farcaster account to use the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requireWallet && !isConnected && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Step 1: Connect your wallet</p>
                <ConnectWalletButton />
              </div>
            )}

            {requireFarcaster && !isFarcasterConnected && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {requireWallet ? "Step 2:" : "Step 1:"} Connect your Farcaster account
                </p>
                <ConnectFarcasterButton />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isConnected && chainId !== 8453) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Wrong Network</CardTitle>
            <CardDescription>Please switch to Base network</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This app requires Base Mainnet. Your wallet should prompt you to switch networks.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
