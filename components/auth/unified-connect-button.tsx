"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

export function UnifiedConnectButton() {
  const {
    isConnected,
    address,
    farcasterUser,
    isFarcasterConnected,
    connectWallet,
    disconnectWallet,
    connectFarcaster,
    disconnectFarcaster,
  } = useAuth()
  const [isMiniapp, setIsMiniapp] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

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
      <Button
        variant="outline"
        size="sm"
        className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm gap-2 bg-transparent"
        onClick={disconnectFarcaster}
      >
        <Image
          src={farcasterUser.pfpUrl || "/abstract-profile.png"}
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
    // Show connected state
    if (isFarcasterConnected && farcasterUser) {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={disconnectFarcaster}
            className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm gap-2 bg-transparent"
          >
            <Image
              src={farcasterUser.pfpUrl || "/abstract-profile.png"}
              alt={farcasterUser.displayName}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="hidden sm:inline truncate max-w-[120px]">{farcasterUser.displayName}</span>
          </Button>
          {isConnected && address && (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm bg-transparent"
            >
              <Wallet className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
              {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
          )}
        </div>
      )
    }

    if (isConnected && address) {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={disconnectWallet}
            className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm bg-transparent"
          >
            <Wallet className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={connectFarcaster}
            className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm bg-transparent"
          >
            <svg className="h-3 w-3 md:h-4 md:w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.24 4.8H5.76C4.3 4.8 3.12 5.98 3.12 7.44v9.12c0 1.46 1.18 2.64 2.64 2.64h12.48c1.46 0 2.64-1.18 2.64-2.64V7.44c0-1.46-1.18-2.64-2.64-2.64zm-1.2 12.96h-2.4v-3.84h-1.32v3.84h-2.64v-3.84H9.36v3.84H6.96V7.44h2.4v3.84h1.32V7.44h2.64v3.84h1.32V7.44h2.4v10.32z" />
            </svg>
            Farcaster
          </Button>
        </div>
      )
    }

    // Show connect options
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={connectWallet}
          className="h-6 md:h-10 px-2 md:px-4 text-[10px] md:text-sm gap-1 md:gap-2"
        >
          <Wallet className="h-2.5 w-2.5 md:h-4 md:w-4" />
          Wallet
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={connectFarcaster}
          className="h-6 md:h-10 px-2 md:px-4 text-[10px] md:text-sm gap-1 md:gap-2 bg-transparent"
        >
          <svg className="h-2.5 w-2.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.24 4.8H5.76C4.3 4.8 3.12 5.98 3.12 7.44v9.12c0 1.46 1.18 2.64 2.64 2.64h12.48c1.46 0 2.64-1.18 2.64-2.64V7.44c0-1.46-1.18-2.64-2.64-2.64zm-1.2 12.96h-2.4v-3.84h-1.32v3.84h-2.64v-3.84H9.36v3.84H6.96V7.44h2.4v3.84h1.32V7.44h2.64v3.84h1.32V7.44h2.4v10.32z" />
          </svg>
          Farcaster
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" disabled className="h-6 md:h-10 px-2 md:px-4 text-[10px] md:text-sm">
      Connecting...
    </Button>
  )
}
