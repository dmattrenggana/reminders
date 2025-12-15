"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import type { FarcasterUser } from "./types"
import { useMiniKit } from "@coinbase/onchainkit/minikit"

// Auth context without wagmi hooks - uses MiniKit and window.ethereum directly

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
  const { context: miniKitContext, setFrameReady, isFrameReady } = useMiniKit()

  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  // Initialize miniapp context
  useEffect(() => {
    const initMiniapp = async () => {
      console.log("[v0] Initializing OnchainKit miniapp...")

      try {
        const inFrame = typeof window !== "undefined" && window.self !== window.top
        const hasFrameContext =
          typeof window !== "undefined" &&
          (!!(window as any).farcasterFrameContext ||
            !!(window as any).farcaster?.context ||
            !!(window as any).frameContext)

        if (!inFrame && !hasFrameContext) {
          console.log("[v0] Not in miniapp context")
          return
        }

        console.log("[v0] Detected miniapp context, signaling frame ready...")

        if (!isFrameReady) {
          setFrameReady()
        }

        // Wait for MiniKit context to be available
        let retries = 0
        const maxRetries = 10

        while (!miniKitContext && retries < maxRetries) {
          console.log("[v0] Waiting for MiniKit context... attempt", retries + 1)
          await new Promise((resolve) => setTimeout(resolve, 300))
          retries++
        }

        if (miniKitContext?.user) {
          console.log("[v0] MiniKit user found:", {
            fid: miniKitContext.user.fid,
            username: miniKitContext.user.username,
            displayName: miniKitContext.user.displayName,
            pfpUrl: miniKitContext.user.pfpUrl,
          })

          const profile: FarcasterUser = {
            fid: miniKitContext.user.fid,
            username: miniKitContext.user.username || `fid-${miniKitContext.user.fid}`,
            displayName:
              miniKitContext.user.displayName || miniKitContext.user.username || `User ${miniKitContext.user.fid}`,
            pfpUrl: miniKitContext.user.pfpUrl || "/placeholder.svg?height=40&width=40",
            walletAddress: address || undefined,
          }

          console.log("[v0] Setting Farcaster profile:", profile)
          setFarcasterUser(profile)
          setIsFarcasterConnected(true)
        } else {
          console.log("[v0] No user in MiniKit context yet")
        }
      } catch (error) {
        console.error("[v0] Miniapp initialization error:", error)
      }
    }

    initMiniapp()
  }, [miniKitContext, isFrameReady, setFrameReady])

  // Update Farcaster user when MiniKit context changes
  useEffect(() => {
    if (miniKitContext?.user && !farcasterUser) {
      console.log("[v0] MiniKit context updated with user:", miniKitContext.user)

      const profile: FarcasterUser = {
        fid: miniKitContext.user.fid,
        username: miniKitContext.user.username || `fid-${miniKitContext.user.fid}`,
        displayName:
          miniKitContext.user.displayName || miniKitContext.user.username || `User ${miniKitContext.user.fid}`,
        pfpUrl: miniKitContext.user.pfpUrl || "/placeholder.svg?height=40&width=40",
        walletAddress: address || undefined,
      }

      setFarcasterUser(profile)
      setIsFarcasterConnected(true)
    }
  }, [miniKitContext, farcasterUser, address])

  const connectWallet = useCallback(async () => {
    console.log("[v0] Connect wallet called")
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)

          // Get chain ID
          const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(Number.parseInt(chainIdHex, 16))

          // Create signer
          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(window.ethereum)
          const newSigner = await provider.getSigner()
          setSigner(newSigner)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to connect wallet:", error)
      throw error
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    console.log("[v0] Disconnecting wallet")
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
