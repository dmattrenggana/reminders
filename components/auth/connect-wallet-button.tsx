"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function ConnectWalletButton() {
  const { isConnected, address, connectWallet, disconnectWallet } = useAuth()

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={disconnectWallet}
        className="h-7 md:h-10 px-2 md:px-4 text-xs md:text-sm bg-transparent"
      >
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
