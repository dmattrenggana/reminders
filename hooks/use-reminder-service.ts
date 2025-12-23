"use client"

import { useEffect, useState } from "react"
import { ReminderService } from "@/lib/contracts/reminder-service"
import { useAccount, useWalletClient } from "wagmi"

export function useReminderService() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [service, setService] = useState<ReminderService | null>(null)

  useEffect(() => {
    // Only create service if connected and have wallet client
    if (!isConnected || !walletClient || typeof window === "undefined") {
      setService(null)
      return
    }

    // Convert Wagmi wallet client to ethers signer
    const createService = async () => {
      try {
        console.log("[useReminderService] Creating signer from Wagmi wallet client...")
        
        const { BrowserProvider } = await import("ethers")
        
        // Create ethers provider from wallet client
        const provider = new BrowserProvider(walletClient as any)
        const signer = await provider.getSigner()
        
        // Store signer in window for ReminderService to access
        (window as any).__wagmiSigner = signer
        
        console.log("[useReminderService] ✅ Signer created from Wagmi wallet client")
        console.log("[useReminderService] Address:", await signer.getAddress())
        
        // Create service with signer
        const newService = new ReminderService(signer)
        setService(newService)
      } catch (error: any) {
        console.error("[useReminderService] Failed to create signer:", error?.message || error)
        setService(null)
      }
    }

    createService()
  }, [isConnected, walletClient])

  return service
}
