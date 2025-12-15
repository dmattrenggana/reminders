"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import type { FarcasterUser } from "./types"
import { useMiniKit } from "@coinbase/onchainkit/minikit"

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
  const { setFrameReady, isFrameReady, context: miniKitContext } = useMiniKit()

  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    setFrameReady()
  }, [setFrameReady])

  useEffect(() => {
    console.log("[v0] MiniKit state:", {
      isFrameReady,
      hasContext: !!miniKitContext,
      contextKeys: miniKitContext ? Object.keys(miniKitContext) : [],
      hasUser: !!miniKitContext?.user,
      userDetails: miniKitContext?.user
        ? {
            fid: miniKitContext.user.fid,
            username: miniKitContext.user.username,
            hasAddress: !!miniKitContext.user.address,
          }
        : null,
    })

    if (miniKitContext?.user) {
      const user = miniKitContext.user

      const profile: FarcasterUser = {
        fid: user.fid,
        username: user.username || `fid-${user.fid}`,
        displayName: user.displayName || user.username || `User ${user.fid}`,
        pfpUrl: user.pfpUrl || "/placeholder.svg?height=40&width=40",
        walletAddress: user.address || undefined,
      }

      console.log("[v0] Auto-authenticated from MiniKit context:", profile)
      setFarcasterUser(profile)
      setIsFarcasterConnected(true)

      if (user.address) {
        setAddress(user.address)
        setIsConnected(true)
      }
    }
  }, [miniKitContext, isFrameReady])

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
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

  return <AuthProviderContent>{children}</AuthProviderContent>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
