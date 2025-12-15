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

function WagmiHooks({
  onHooksReady,
}: {
  onHooksReady: (data: {
    address: string | undefined
    isConnected: boolean
    chainId: number | undefined
    connect: any
    connectors: any[]
    disconnect: any
  }) => void
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait 300ms for WagmiProvider to initialize
    const timer = setTimeout(() => setIsReady(true), 300)
    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return null
  }

  return <WagmiHooksInner onHooksReady={onHooksReady} />
}

function WagmiHooksInner({
  onHooksReady,
}: {
  onHooksReady: (data: {
    address: string | undefined
    isConnected: boolean
    chainId: number | undefined
    connect: any
    connectors: any[]
    disconnect: any
  }) => void
}) {
  const wagmi = require("wagmi")
  const accountData = wagmi.useAccount()
  const connectData = wagmi.useConnect()
  const disconnectData = wagmi.useDisconnect()

  useEffect(() => {
    onHooksReady({
      address: accountData.address,
      isConnected: accountData.isConnected || false,
      chainId: accountData.chainId,
      connect: connectData.connect,
      connectors: connectData.connectors || [],
      disconnect: disconnectData.disconnect,
    })
  }, [
    accountData.address,
    accountData.isConnected,
    accountData.chainId,
    connectData.connect,
    connectData.connectors,
    disconnectData.disconnect,
    onHooksReady,
  ])

  return null
}
// </CHANGE>

function AuthProviderContent({ children }: { children: ReactNode }) {
  const { context: miniKitContext, setFrameReady, isFrameReady } = useMiniKit()

  const [wagmiData, setWagmiData] = useState<{
    address: string | undefined
    isConnected: boolean
    chainId: number | undefined
    connect: any
    connectors: any[]
    disconnect: any
  }>({
    address: undefined,
    isConnected: false,
    chainId: undefined,
    connect: async () => {},
    connectors: [],
    disconnect: () => {},
  })
  // </CHANGE>

  const [signer, setSigner] = useState<any>(null)
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)

  const { address, isConnected, chainId, connect, connectors, disconnect } = wagmiData

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

        if (miniKitContext && connectors.length > 0 && connect) {
          console.log("[v0] Auto-connecting miniapp wallet...")
          const miniappConnector = connectors[0]
          try {
            await connect({ connector: miniappConnector })
            console.log("[v0] Miniapp wallet connected successfully")
          } catch (error) {
            console.error("[v0] Failed to auto-connect miniapp wallet:", error)
          }
        }
      } catch (error) {
        console.error("[v0] Miniapp initialization error:", error)
      }
    }

    if (connectors.length > 0) {
      initMiniapp()
    }
  }, [miniKitContext, isFrameReady, setFrameReady, connectors, connect, address])

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

  useEffect(() => {
    const updateSigner = async () => {
      if (isConnected && address && typeof window !== "undefined" && window.ethereum) {
        try {
          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(window.ethereum)
          const newSigner = await provider.getSigner()
          setSigner(newSigner)
          console.log("[v0] Signer updated for address:", address)
        } catch (error) {
          console.error("[v0] Failed to create signer:", error)
        }
      } else {
        setSigner(null)
      }
    }

    updateSigner()
  }, [isConnected, address])

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
    address: address || null,
    walletAddress: address || null,
    chainId: chainId ? Number(chainId) : null,
    signer,
    isFarcasterConnected,
    farcasterUser,
    connectWallet,
    disconnectWallet,
    connectFarcaster,
    disconnectFarcaster,
    ensureSigner,
  }

  return (
    <AuthContext.Provider value={value}>
      <WagmiHooks onHooksReady={setWagmiData} />
      {/* </CHANGE> */}
      {children}
    </AuthContext.Provider>
  )
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
