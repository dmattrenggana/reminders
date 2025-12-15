"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import type { FarcasterUser } from "./types"

interface AuthContextType {
  // Wallet Connection State
  isConnected: boolean
  address: string | null
  walletAddress: string | null
  chainId: number | null
  signer: any | null

  // Farcaster Connection State
  isFarcasterConnected: boolean
  farcasterUser: FarcasterUser | null

  // Wallet Methods
  connectWallet: () => Promise<void>
  disconnectWallet: () => void

  // Farcaster Methods
  connectFarcaster: () => Promise<void>
  disconnectFarcaster: () => void

  // Utility Methods
  ensureSigner: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    const frameProvider = (window as any).__frameEthProvider

    if (frameProvider) {
      const initFrameSigner = async () => {
        try {
          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(frameProvider)
          const frameSigner = await provider.getSigner()
          const frameAddress = await frameSigner.getAddress()

          setSigner(frameSigner)
          setAddress(frameAddress)
          setIsConnected(true)
          setChainId(8453) // Base Mainnet

          // Store for ReminderService
          ;(window as any).__frameSigner = frameSigner
        } catch (error) {
          console.error("Failed to initialize frame signer:", error)
        }
      }

      initFrameSigner()
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const fid = params.get("farcaster_fid")
      const username = params.get("farcaster_username")
      const displayName = params.get("farcaster_display_name")
      const pfpUrl = params.get("farcaster_pfp")
      const verifiedAddress = params.get("farcaster_address")

      if (fid && username) {
        const user: FarcasterUser = {
          fid: Number.parseInt(fid),
          username,
          displayName: displayName || username,
          pfpUrl: pfpUrl || "",
          verifiedAddresses: verifiedAddress ? [verifiedAddress] : [],
        }

        setFarcasterUser(user)
        setIsFarcasterConnected(true)

        if (verifiedAddress) {
          setAddress(verifiedAddress)
          setIsConnected(true)
        }

        // Clean up URL params
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete("farcaster_fid")
        cleanUrl.searchParams.delete("farcaster_username")
        cleanUrl.searchParams.delete("farcaster_display_name")
        cleanUrl.searchParams.delete("farcaster_pfp")
        cleanUrl.searchParams.delete("farcaster_address")
        window.history.replaceState({}, "", cleanUrl.toString())
      }
    }
  }, [])

  const connectWallet = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)

          const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(Number.parseInt(chainIdHex, 16))

          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(window.ethereum)
          const newSigner = await provider.getSigner()
          setSigner(newSigner)
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
    setChainId(null)
    setSigner(null)
  }, [])

  const connectFarcaster = useCallback(async () => {
    try {
      const response = await fetch("/api/farcaster/auth", { method: "POST" })
      const { authUrl } = await response.json()

      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (error) {
      console.error("Failed to connect Farcaster:", error)
      throw error
    }
  }, [])

  const disconnectFarcaster = useCallback(() => {
    setIsFarcasterConnected(false)
    setFarcasterUser(null)
  }, [])

  const ensureSigner = useCallback(async () => {
    if (signer) return signer

    if (!isConnected || !window.ethereum) {
      throw new Error("Wallet not connected")
    }

    const { BrowserProvider } = await import("ethers")
    const provider = new BrowserProvider(window.ethereum)
    const newSigner = await provider.getSigner()
    setSigner(newSigner)
    return newSigner
  }, [signer, isConnected])

  const value: AuthContextType = {
    isConnected,
    address,
    walletAddress: address,
    chainId,
    signer,
    isFarcasterConnected,
    farcasterUser,
    connectWallet,
    disconnectWallet,
    connectFarcaster,
    disconnectFarcaster,
    ensureSigner,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
