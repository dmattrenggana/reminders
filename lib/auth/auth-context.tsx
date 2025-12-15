"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import type { FarcasterUser } from "./types"
import sdk, { type Context } from "@farcaster/frame-sdk"
import { useAccount, useConnect, useDisconnect } from "wagmi"

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
  const { address: wagmiAddress, isConnected: wagmiConnected, chainId: wagmiChainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [sdkContext, setSdkContext] = useState<Context | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initMiniapp = async () => {
      console.log("[v0] Initializing miniapp...")

      try {
        // Check if running in a frame context
        const inFrame = typeof window !== "undefined" && window.self !== window.top
        const hasFrameContext =
          typeof window !== "undefined" &&
          (!!(window as any).farcasterFrameContext ||
            !!(window as any).farcaster?.context ||
            !!(window as any).frameContext)

        if (!inFrame && !hasFrameContext) {
          console.log("[v0] Not in miniapp context")
          setIsInitialized(true)
          return
        }

        console.log("[v0] Detected miniapp context, initializing SDK...")

        // Initialize SDK
        const context = await sdk.actions.ready()
        console.log("[v0] SDK ready, context:", context)
        setSdkContext(context)

        // Get user from SDK context
        if (context?.user) {
          console.log("[v0] SDK user found:", context.user)

          const profile: FarcasterUser = {
            fid: context.user.fid,
            username: context.user.username || `fid-${context.user.fid}`,
            displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || "/abstract-profile.png",
          }

          setFarcasterUser(profile)
          setIsFarcasterConnected(true)
          console.log("[v0] Farcaster profile set from SDK:", profile)
        } else {
          console.log("[v0] No user in SDK context")
        }

        if (context && connectors.length > 0) {
          console.log("[v0] Auto-connecting miniapp wallet...")
          const miniappConnector = connectors[0]
          try {
            await connect({ connector: miniappConnector })
            console.log("[v0] Miniapp wallet connected successfully")
          } catch (error) {
            console.error("[v0] Failed to auto-connect miniapp wallet:", error)
          }
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("[v0] Miniapp initialization error:", error)
        setIsInitialized(true)
      }
    }

    initMiniapp()
  }, [connect, connectors])

  useEffect(() => {
    const updateSigner = async () => {
      if (wagmiConnected && wagmiAddress && typeof window !== "undefined" && window.ethereum) {
        try {
          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(window.ethereum)
          const newSigner = await provider.getSigner()
          setSigner(newSigner)
          console.log("[v0] Signer updated for address:", wagmiAddress)
        } catch (error) {
          console.error("[v0] Failed to create signer:", error)
        }
      } else {
        setSigner(null)
      }
    }

    updateSigner()
  }, [wagmiConnected, wagmiAddress])

  const connectWallet = useCallback(async () => {
    console.log("[v0] Connect wallet called")
    try {
      if (connectors.length > 0) {
        console.log("[v0] Connecting with connector:", connectors[0].name)
        await connect({ connector: connectors[0] })
      } else {
        throw new Error("No wallet connectors available")
      }
    } catch (error) {
      console.error("[v0] Failed to connect wallet:", error)
      throw error
    }
  }, [connect, connectors])

  const disconnectWallet = useCallback(() => {
    console.log("[v0] Disconnecting wallet")
    disconnect()
    setSigner(null)
  }, [disconnect])

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

    if (!wagmiConnected || !window.ethereum) {
      throw new Error("Wallet not connected")
    }

    const { BrowserProvider } = await import("ethers")
    const provider = new BrowserProvider(window.ethereum)
    const newSigner = await provider.getSigner()
    setSigner(newSigner)
    return newSigner
  }, [signer, wagmiConnected])

  const value: AuthContextType = {
    isConnected: wagmiConnected,
    address: wagmiAddress || null,
    walletAddress: wagmiAddress || null,
    chainId: wagmiChainId ? Number(wagmiChainId) : null,
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
