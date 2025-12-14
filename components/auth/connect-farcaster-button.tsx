"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

export function ConnectFarcasterButton() {
  const { isFarcasterConnected, farcasterUser, connectFarcaster, disconnectFarcaster } = useAuth()

  if (isFarcasterConnected && farcasterUser) {
    const avatarSrc =
      typeof farcasterUser.pfpUrl === "string" && farcasterUser.pfpUrl.length > 0
        ? farcasterUser.pfpUrl
        : "/placeholder.svg"

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={disconnectFarcaster}
        className="gap-1 md:gap-1.5 bg-transparent h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm"
      >
        <Avatar className="h-4 w-4 md:h-5 md:w-5">
          <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={String(farcasterUser.username || "User")} />
          <AvatarFallback>{farcasterUser.username?.[0]?.toUpperCase() || "F"}</AvatarFallback>
        </Avatar>
        <span className="truncate max-w-[80px]">{farcasterUser.username}</span>
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={connectFarcaster}
      className="h-6 md:h-10 px-2 md:px-4 text-[10px] md:text-sm gap-1 md:gap-2"
    >
      <Image src="/farcaster-icon.png" alt="Farcaster" width={10} height={10} className="md:w-4 md:h-4" />
      <span className="hidden sm:inline">Connect Farcaster</span>
      <span className="sm:hidden">Connect</span>
    </Button>
  )
}
