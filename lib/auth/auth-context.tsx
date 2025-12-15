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

function AuthProviderContent({ children }: { children: ReactNode }) {
  console.log("[v0] AuthProviderContent rendering")

  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    console.log("[v0] Checking for miniapp frame provider")
    const frameProvider = (window as any).__frameEthProvider
    console.log("[v0] Frame provider available:", !!frameProvider)

    if (frameProvider) {
      console.log("[v0] Miniapp detected, setting up frame signer")
      // Auto-initialize frame signer for transactions in miniapp
      const initFrameSigner = async () => {
        try {
          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(frameProvider)
          const frameSigner = await provider.getSigner()
          const frameAddress = await frameSigner.getAddress()

          console.log("[v0] Frame signer initialized, address:", frameAddress)

          setSigner(frameSigner)
          setAddress(frameAddress)
          setIsConnected(true)
          setChainId(8453) // Base Mainnet

          // Store for ReminderService
          ;(window as any).__frameSigner = frameSigner
        } catch (error) {
          console.error("[v0] Failed to initialize frame signer:", error)
        }
      }

      initFrameSigner()
    }
  }, [])

  useEffect(() => {
    console.log("[v0] Checking URL params for Farcaster auth")
    // Check if we have Farcaster auth data in URL params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const fid = params.get("farcaster_fid")
      const username = params.get("farcaster_username")
      const displayName = params.get("farcaster_display_name")
      const pfpUrl = params.get("farcaster_pfp")
      const verifiedAddress = params.get("farcaster_address")

      console.log("[v0] Farcaster params:", { fid, username, displayName, pfpUrl, verifiedAddress })

      if (fid && username) {
        console.log("[v0] Setting Farcaster user from URL params")
        const user: FarcasterUser = {
          fid: Number.parseInt(fid),
          username,
          displayName: displayName || username,
          pfpUrl: pfpUrl || "",
          verifiedAddresses: verifiedAddress ? [verifiedAddress] : [],
        }

        setFarcasterUser(user)
        setIsFarcasterConnected(true)

        // Set wallet address if available
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
    console.log("[v0] connectWallet called")
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        console.log("[v0] Wallet accounts:", accounts)
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)

          const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(Number.parseInt(chainIdHex, 16))

          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(window.ethereum)
          const newSigner = await provider.getSigner()
          setSigner(newSigner)
          console.log("[v0] Wallet connected successfully")
        }
      }
    } catch (error) {
      console.error("[v0] Failed to connect wallet:", error)
      throw error
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    console.log("[v0] disconnectWallet called")
    setAddress(null)
    setIsConnected(false)
    setChainId(null)
    setSigner(null)
  }, [])

  const connectFarcaster = useCallback(async () => {
    console.log("[v0] connectFarcaster called")
    try {
      const response = await fetch("/api/farcaster/auth", { method: "POST" })
      const { authUrl } = await response.json()

      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (error) {
      console.error("[v0] Failed to connect Farcaster:", error)
      throw error
    }
  }, [])

  const disconnectFarcaster = useCallback(() => {
    console.log("[v0] disconnectFarcaster called")
    setIsFarcasterConnected(false)
    setFarcasterUser(null)
  }, [])

  const ensureSigner = useCallback(async () => {
    console.log("[v0] ensureSigner called")
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

  console.log("[v0] AuthProviderContent state:", { isConnected, isFarcasterConnected, address })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("[v0] AuthProvider rendering")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    console.log("[v0] AuthProvider client-side mounted")
    setIsClient(true)
  }, [])

  if (!isClient) {
    console.log("[v0] AuthProvider server-side render")
    const loadingValue: AuthContextType = {
      isConnected: false,
      address: null,
      walletAddress: null,
      chainId: null,
      signer: null,
      isFarcasterConnected: false,
      farcasterUser: null,
      connectWallet: async () => {},
      disconnectWallet: () => {},
      connectFarcaster: async () => {},
      disconnectFarcaster: () => {},
      ensureSigner: async () => null,
    }
    return <AuthContext.Provider value={loadingValue}>{children}</AuthContext.Provider>
  }

  console.log("[v0] AuthProvider rendering content")
  return <AuthProviderContent>{children}</AuthProviderContent>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
