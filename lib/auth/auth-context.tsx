"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import type { FarcasterUser } from "./types"
import sdk, { type Context } from "@farcaster/frame-sdk"

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
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [sdkContext, setSdkContext] = useState<Context | null>(null)

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
          return
        }

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

        // Handle wallet connection from miniapp
        if (context?.client?.ethProviderUrl) {
          console.log("[v0] Miniapp wallet is auto-connected")
          setIsConnected(true)
        }
      } catch (error) {
        console.error("[v0] Miniapp initialization error:", error)
      }
    }

    initMiniapp()
  }, [])

  useEffect(() => {
    const initializeWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const { BrowserProvider } = await import("ethers")
          const accounts = await window.ethereum.request({ method: "eth_accounts" })

          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)

            const provider = new BrowserProvider(window.ethereum)
            const network = await provider.getNetwork()
            setChainId(Number(network.chainId))

            const signer = await provider.getSigner()
            setSigner(signer)

            console.log("[v0] Wallet initialized:", accounts[0])
          }
        } catch (error) {
          console.error("[v0] Failed to initialize wallet:", error)
        }
      }
    }

    initializeWallet()
  }, [])

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed")

      const { BrowserProvider } = await import("ethers")
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)

        const provider = new BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        setChainId(Number(network.chainId))

        const signer = await provider.getSigner()
        setSigner(signer)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setIsConnected(false)
    setAddress(null)
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

    if (!window.ethereum) throw new Error("Wallet not connected")

    const { BrowserProvider } = await import("ethers")
    const provider = new BrowserProvider(window.ethereum)
    const newSigner = await provider.getSigner()
    setSigner(newSigner)
    return newSigner
  }, [signer])

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
