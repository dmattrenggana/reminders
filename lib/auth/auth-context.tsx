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
  isMiniapp: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  connectFarcaster: () => Promise<void>
  disconnectFarcaster: () => void
  ensureSigner: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isMiniapp, setIsMiniapp] = useState(false)

  const isConnected = !!address || wagmiConnected
  const isFarcasterConnected = !!farcasterUser

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      if (isMiniapp) {
        handleMiniappConnection(wagmiAddress)
      } else {
        // For web, just set the address
        setAddress(wagmiAddress)
      }
    }
  }, [wagmiConnected, wagmiAddress, isMiniapp])

  async function initializeAuth() {
    const isInIframe = typeof window !== "undefined" && window.self !== window.top
    setIsMiniapp(isInIframe)

    // Check for stored Farcaster user (web OAuth flow)
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

    if (isInIframe) {
      await initMiniapp()
    }
  }

  async function initMiniapp() {
    try {
      console.log("[v0] Initializing miniapp...")
      const { sdk } = await import("@farcaster/frame-sdk")

      // Store SDK globally for contract operations
      ;(window as any).__frameSdk = sdk
      ;(window as any).__frameEthProvider = sdk.wallet.ethProvider

      sdk.actions.ready({})
      console.log("[v0] Splash screen dismissed")

      // Auto-connect after SDK is ready
      setTimeout(() => {
        const farcasterConnector = connectors.find((c) => c.id === "farcaster")
        if (farcasterConnector && !wagmiConnected) {
          console.log("[v0] Auto-connecting with Farcaster connector...")
          connect({ connector: farcasterConnector })
        }
      }, 1000)
    } catch (error) {
      console.error("Miniapp initialization error:", error)
    }
  }

  async function handleMiniappConnection(walletAddr: string) {
    console.log("[v0] Setting up miniapp connection for:", walletAddr)
    setAddress(walletAddr)

    const frameProvider = (window as any).__frameEthProvider
    if (frameProvider) {
      try {
        const { BrowserProvider } = await import("ethers")
        const provider = new BrowserProvider(frameProvider)
        const frameSigner = await provider.getSigner()
        console.log("[v0] Frame SDK signer created successfully")
        setSigner(frameSigner)
        // Store globally for contract service
        ;(window as any).__frameSigner = frameSigner
      } catch (error) {
        console.error("[v0] Frame signer setup error:", error)
      }
    }

    await fetchMiniappProfile(walletAddr)
  }

  async function fetchMiniappProfile(walletAddr: string) {
    console.log("[v0] Fetching miniapp profile for:", walletAddr)
    try {
      const sdk = (window as any).__frameSdk
      if (sdk?.context) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const context = sdk.context
        console.log("[v0] SDK context available:", !!context)

        if (context.user) {
          console.log("[v0] Extracting profile from SDK context...")

          const profile: FarcasterUser = {
            fid: context.user.fid ? Number(String(context.user.fid)) : 0,
            username: context.user.username
              ? String(context.user.username)
              : context.user.displayName
                ? String(context.user.displayName)
                : "user",
            displayName: context.user.displayName
              ? String(context.user.displayName)
              : context.user.username
                ? String(context.user.username)
                : "User",
            pfpUrl: context.user.pfpUrl ? String(context.user.pfpUrl) : "/abstract-profile.png",
            walletAddress: walletAddr,
          }

          console.log("[v0] Profile extracted:", { fid: profile.fid, username: profile.username })

          if (profile.fid > 0) {
            setFarcasterUser(profile)
            console.log("[v0] Farcaster user set successfully")
            return
          }
        }
      }

      console.log("[v0] Falling back to API for profile...")
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
        console.log("[v0] Profile from API:", { fid: profile.fid, username: profile.username })
        setFarcasterUser(profile)
      }
    } catch (error) {
      console.error("[v0] Profile fetch error:", error)
    }
  }

  async function connectWallet() {
    if (isMiniapp) {
      connectFarcaster()
      return
    }

    console.log("[v0] Connecting web wallet...")
    if (!window?.ethereum) {
      alert("Please install MetaMask or another Web3 wallet")
      return
    }

    try {
      const { BrowserProvider } = await import("ethers")
      const provider = new BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      console.log("[v0] Web wallet connected:", address)
      setAddress(address)
      setSigner(signer)
      // Store globally for contract service
      ;(window as any).__webSigner = signer
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    }
  }

  function disconnectWallet() {
    setAddress(null)
    setSigner(null)
  }

  async function connectFarcaster() {
    if (isMiniapp) {
      // Miniapp: use Wagmi connector
      const farcasterConnector = connectors.find((c) => c.id === "farcaster")
      if (farcasterConnector) {
        connect({ connector: farcasterConnector })
      }
      return
    }

    // Web: OAuth flow
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

  async function ensureSigner(): Promise<any> {
    console.log("[v0] ensureSigner called, current signer:", !!signer)

    if (signer) {
      console.log("[v0] Signer already available")
      return signer
    }

    // Try to get from global storage
    const storedFrameSigner = (window as any).__frameSigner
    const storedWebSigner = (window as any).__webSigner

    if (storedFrameSigner) {
      console.log("[v0] Using stored Frame SDK signer")
      setSigner(storedFrameSigner)
      return storedFrameSigner
    }

    if (storedWebSigner) {
      console.log("[v0] Using stored web signer")
      setSigner(storedWebSigner)
      return storedWebSigner
    }

    // Try to create signer based on environment
    if (isMiniapp) {
      const frameProvider = (window as any).__frameEthProvider
      if (frameProvider) {
        try {
          console.log("[v0] Creating new Frame SDK signer")
          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(frameProvider)
          const frameSigner = await provider.getSigner()
          setSigner(frameSigner)
          ;(window as any).__frameSigner = frameSigner
          return frameSigner
        } catch (error) {
          console.error("[v0] Failed to create Frame SDK signer:", error)
          throw new Error("Failed to setup Frame SDK signer. Please reconnect.")
        }
      }
    } else if (window?.ethereum) {
      try {
        console.log("[v0] Creating new web wallet signer")
        const { BrowserProvider } = await import("ethers")
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        setSigner(signer)
        ;(window as any).__webSigner = signer
        return signer
      } catch (error) {
        console.error("[v0] Failed to create web signer:", error)
        throw new Error("Failed to connect wallet. Please reconnect.")
      }
    }

    throw new Error("No wallet provider available. Please connect your wallet.")
  }

  return (
    <AuthContext.Provider
      value={{
        address,
        signer,
        isConnected,
        farcasterUser,
        isFarcasterConnected,
        isMiniapp,
        connectWallet,
        disconnectWallet,
        connectFarcaster,
        disconnectFarcaster,
        ensureSigner,
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
