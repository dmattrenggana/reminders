"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

export function FarcasterProfileCard() {
  const { farcasterUser, isFarcasterConnected } = useAuth()

  if (!isFarcasterConnected || !farcasterUser) {
    return null
  }

  const avatarSrc =
    typeof farcasterUser.pfpUrl === "string" && farcasterUser.pfpUrl.length > 0
      ? farcasterUser.pfpUrl
      : "/abstract-profile.png"

  const displayName =
    typeof farcasterUser.displayName === "string" && farcasterUser.displayName.length > 0
      ? farcasterUser.displayName
      : typeof farcasterUser.username === "string" && farcasterUser.username.length > 0
        ? farcasterUser.username
        : "User"

  const username =
    typeof farcasterUser.username === "string" && farcasterUser.username.length > 0 ? farcasterUser.username : "user"

  const fid = typeof farcasterUser.fid === "number" && farcasterUser.fid > 0 ? farcasterUser.fid : 0

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-purple-500/50">
          <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={displayName} />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold truncate">{displayName}</h3>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
              Farcaster
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">@{username}</p>
          <p className="text-xs text-muted-foreground mt-1">FID: {fid}</p>
        </div>
      </div>
    </Card>
  )
}
