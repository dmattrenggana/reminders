"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import type { FarcasterUser } from "./types"

interface AuthContextType {
  address: string | null
  signer: any
  isConnected: boolean
  farcasterUser: FarcasterUser | null
  isFarcasterConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  connectFarcaster: () => Promise<void>
  disconnectFarcaster: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)

  const isConnected = !!address || wagmiConnected
  const isFarcasterConnected = !!farcasterUser

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      handleWagmiConnection(wagmiAddress)
    }
  }, [wagmiConnected, wagmiAddress])

  async function initializeAuth() {
    // Check for stored Farcaster user
    const stored = localStorage.getItem("farcaster_user")
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user.fid > 0) {
          setFarcasterUser(user)
          if (user.walletAddress) setAddress(user.walletAddress)
        }
      } catch (error) {
        localStorage.removeItem("farcaster_user")
      }
    }

    // Initialize miniapp if in iframe
    if (typeof window !== "undefined" && window.self !== window.top) {
      await initMiniapp()
    }
  }

  async function initMiniapp() {
    try {
      const { sdk } = await import("@farcaster/frame-sdk")

      sdk.actions.ready({})

      // Store SDK globally
      ;(window as any).__frameSdk = sdk

      // Store eth provider for transactions
      try {
        ;(window as any).__frameEthProvider = sdk.wallet.ethProvider
      } catch {}

      // Auto-connect after a delay
      setTimeout(() => {
        const farcasterConnector = connectors.find((c) => c.id === "farcaster")
        if (farcasterConnector && !wagmiConnected) {
          connect({ connector: farcasterConnector })
        }
      }, 1000)
    } catch (error) {
      console.error("Error initializing miniapp:", error)
    }
  }

  async function handleWagmiConnection(walletAddr: string) {
    setAddress(walletAddr)

    // Setup Frame SDK signer if available
    const frameProvider = (window as any).__frameEthProvider
    if (frameProvider) {
      try {
        console.log("[v0] Setting up Frame SDK signer for wallet:", walletAddr)
        const { BrowserProvider } = await import("ethers")
        const provider = new BrowserProvider(frameProvider)
        const frameSigner = await provider.getSigner()
        setSigner(frameSigner)
        console.log("[v0] Frame SDK signer ready")
      } catch (error) {
        console.error("[v0] Error creating Frame SDK signer:", error)
        // Create a minimal signer for read operations
        setSigner({ getAddress: async () => walletAddr })
      }
    } else {
      // Create a minimal signer for read operations
      setSigner({ getAddress: async () => walletAddr })
    }

    // Fetch Farcaster profile after signer is set
    await fetchFarcasterProfile(walletAddr)
  }

  async function fetchFarcasterProfile(walletAddr: string) {
    try {
      // Try Frame SDK first
      const sdk = (window as any).__frameSdk
      if (sdk?.context?.user) {
        const user = sdk.context.user
        const profile: FarcasterUser = {
          fid: Number(user.fid) || 0,
          username: String(user.username || user.displayName || "user"),
          displayName: String(user.displayName || user.username || "User"),
          pfpUrl: String(user.pfpUrl || "/abstract-profile.png"),
          walletAddress: walletAddr,
        }

        if (profile.fid > 0) {
          setFarcasterUser(profile)
          localStorage.setItem("farcaster_user", JSON.stringify(profile))
          return
        }
      }

      // Fallback to API
      const response = await fetch(`/api/farcaster/user?address=${walletAddr}`)
      if (response.ok) {
        const data = await response.json()
        const profile: FarcasterUser = {
          fid: data.fid || 0,
          username: data.username || "user",
          displayName: data.displayName || data.username || "User",
          pfpUrl: data.pfpUrl || "/abstract-profile.png",
          walletAddress: walletAddr,
        }
        setFarcasterUser(profile)
        localStorage.setItem("farcaster_user", JSON.stringify(profile))
      }
    } catch (error) {
      console.error("Error fetching Farcaster profile:", error)
    }
  }

  async function connectWallet() {
    if (!window?.ethereum) {
      alert("Please install MetaMask")
      return
    }

    try {
      const { BrowserProvider } = await import("ethers")
      const provider = new BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setAddress(address)
      setSigner(signer)
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }

  function disconnectWallet() {
    setAddress(null)
    setSigner(null)
  }

  async function connectFarcaster() {
    const isMiniapp = typeof window !== "undefined" && window.self !== window.top

    if (isMiniapp) {
      const farcasterConnector = connectors.find((c) => c.id === "farcaster")
      if (farcasterConnector) {
        connect({ connector: farcasterConnector })
      }
      return
    }

    // OAuth flow for web
    const width = 500
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const authUrl = `/api/farcaster/auth?returnTo=${encodeURIComponent(window.location.href)}`
    const popup = window.open(authUrl, "Farcaster Sign In", `width=${width},height=${height},left=${left},top=${top}`)

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === "FARCASTER_AUTH_SUCCESS") {
        const user = event.data.user
        setFarcasterUser(user)
        localStorage.setItem("farcaster_user", JSON.stringify(user))
        if (user.walletAddress) setAddress(user.walletAddress)
        popup?.close()
        window.removeEventListener("message", handleMessage)
      }
    }

    window.addEventListener("message", handleMessage)
  }

  function disconnectFarcaster() {
    if (wagmiConnected) wagmiDisconnect()
    setFarcasterUser(null)
    localStorage.removeItem("farcaster_user")
  }

  return (
    <AuthContext.Provider
      value={{
        address,
        signer,
        isConnected,
        farcasterUser,
        isFarcasterConnected,
        connectWallet,
        disconnectWallet,
        connectFarcaster,
        disconnectFarcaster,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
