"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const inFrame = window.self !== window.top
      const hasFrameContext =
        !!(window as any).farcasterFrameContext ||
        !!(window as any).farcaster?.context ||
        !!(window as any).frameContext

      const isMiniappFrame = inFrame || hasFrameContext
      setIsMiniapp(isMiniappFrame)
    }
  }, [isFarcasterConnected, farcasterUser])

  if (isFarcasterConnected && farcasterUser) {
    const avatarSrc =
      typeof farcasterUser.pfpUrl === "string" && farcasterUser.pfpUrl.length > 0
        ? farcasterUser.pfpUrl
        : "/placeholder.svg?height=40&width=40"

    const displayName =
      typeof farcasterUser.displayName === "string" && farcasterUser.displayName.length > 0
        ? farcasterUser.displayName
        : typeof farcasterUser.username === "string" && farcasterUser.username.length > 0
          ? farcasterUser.username
          : "User"

    const username =
      typeof farcasterUser.username === "string" && farcasterUser.username.length > 0 ? farcasterUser.username : "user"

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm gap-2 bg-transparent"
          >
            <Image
              src={avatarSrc || "/placeholder.svg"}
              alt={displayName}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="hidden sm:inline truncate max-w-[120px]">{displayName}</span>
            <span className="sm:hidden truncate max-w-[80px]">@{username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {address && (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {address.slice(0, 6)}...{address.slice(-4)}
            </DropdownMenuItem>
          )}
          {!isMiniapp && <DropdownMenuItem onClick={disconnectFarcaster}>Disconnect Farcaster</DropdownMenuItem>}
          {isMiniapp && <DropdownMenuItem disabled>Connected via Farcaster</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (isConnected && address && !isFarcasterConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm bg-transparent">
            <Wallet className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={disconnectWallet}>Disconnect Wallet</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="h-9 md:h-10 px-3 md:px-4 text-sm md:text-base !bg-blue-500 hover:!bg-blue-600 text-white border-0"
        >
          Connect
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={connectWallet}>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={connectFarcaster}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.24 4.8H5.76C4.3 4.8 3.12 5.98 3.12 7.44v9.12c0 1.46 1.18 2.64 2.64 2.64h12.48c1.46 0 2.64-1.18 2.64-2.64V7.44c0-1.46-1.18-2.64-2.64-2.64zm-1.2 12.96h-2.4v-3.84h-1.32v3.84h-2.64v-3.84H9.36v3.84H6.96V7.44h2.4v3.84h1.32V7.44h2.64v3.84h1.32V7.44h2.4v10.32z" />
          </svg>
          Connect Farcaster
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
