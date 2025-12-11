"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { Loader2, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CONTRACT_ADDRESSES } from "@/lib/contracts/config"

const TOKEN_ABI = [
  "function mint(address to, uint256 amount) public",
  "function balanceOf(address account) public view returns (uint256)",
]

export function MintTestTokensButton() {
  const { walletAddress } = useAuth()
  const { toast } = useToast()
  const [isMinting, setIsMinting] = useState(false)

  const mintTokens = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsMinting(true)

      const { BrowserProvider, Contract, parseEther } = await import("ethers")

      // @ts-ignore - ethereum is injected by MetaMask
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const token = new Contract(CONTRACT_ADDRESSES.COMMIT_TOKEN, TOKEN_ABI, signer)

      const amount = parseEther("1000") // 1000 tokens
      const tx = await token.mint(walletAddress, amount)

      toast({
        title: "Minting tokens...",
        description: "Please wait for the transaction to confirm",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: "1000 COMMIT tokens minted to your wallet",
      })
    } catch (error: any) {
      console.error("Mint error:", error)
      toast({
        title: "Mint failed",
        description: error.message || "Failed to mint tokens",
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  if (!walletAddress) return null

  return (
    <Button onClick={mintTokens} disabled={isMinting} variant="outline" size="sm" className="gap-2 bg-transparent">
      {isMinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
      {isMinting ? "Minting..." : "Mint Test Tokens"}
    </Button>
  )
}
