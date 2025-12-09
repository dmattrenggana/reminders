"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

export function UnifiedConnectButton() {
  const { isConnected, address, farcasterUser, connectWallet, disconnectWallet, connectFarcaster } = useAuth()
  const [isMiniapp, setIsMiniapp] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const inFrame = window.self !== window.top
      const hasFrameContext =
        !!(window as any).farcasterFrameContext ||
        !!(window as any).farcaster?.context ||
        !!(window as any).frameContext

      setIsMiniapp(inFrame || hasFrameContext)

      // Auto-connect Farcaster wallet in miniapp
      if ((inFrame || hasFrameContext) && !farcasterUser) {
        connectFarcaster()
      }
    }
  }, [farcasterUser, connectFarcaster])

  if (isMiniapp && farcasterUser) {
    return (
      <Button variant="outline" size="sm" className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm gap-2 bg-transparent">
        <Image
          src={farcasterUser.pfpUrl || "/farcaster-icon.png"}
          alt={farcasterUser.displayName}
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="hidden sm:inline truncate max-w-[120px]">{farcasterUser.displayName}</span>
        <span className="sm:hidden truncate max-w-[80px]">@{farcasterUser.username}</span>
      </Button>
    )
  }

  if (!isMiniapp) {
    if (isConnected && address) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm bg-transparent"
        >
          <Wallet className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      )
    }

    return (
      <Button
        size="sm"
        onClick={connectWallet}
        className="h-6 md:h-10 px-2 md:px-4 text-[10px] md:text-sm gap-1 md:gap-2"
      >
        <Wallet className="h-2.5 w-2.5 md:h-4 md:w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <Button size="sm" disabled className="h-6 md:h-10 px-2 md:px-4 text-[10px] md:text-sm">
      Connecting...
    </Button>
  )
}
