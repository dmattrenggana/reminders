"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isMiniapp, setIsMiniapp] = useState(false)

  const isConnected = !!address
  const isFarcasterConnected = !!farcasterUser

  useEffect(() => {
    initializeAuth()
  }, [])

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
      ;(window as any).__frameSdk = sdk
      ;(window as any).__frameEthProvider = sdk.wallet.ethProvider

      sdk.actions.ready({})
      console.log("[v0] Splash screen dismissed")

      setTimeout(async () => {
        try {
          console.log("[v0] Starting miniapp authentication...")

          const context = await sdk.context

          if (!context || !context.user) {
            console.error("[v0] SDK context or context.user not available")
            return
          }

          console.log("[v0] SDK context loaded successfully")

          const fid = context.user.fid
          const username = context.user.username
          const displayName = context.user.displayName || username
          const pfpUrl = context.user.pfpUrl || "/abstract-profile.png"

          console.log("[v0] ✅ Extracted - FID:", fid, "Username:", username)

          if (!fid || !username) {
            console.error("[v0] Invalid FID or username")
            return
          }

          // Fetch wallet address from API
          console.log("[v0] Fetching profile from API for username:", username)
          const response = await fetch(`/api/farcaster/user?username=${username}`)

          if (!response.ok) {
            console.error("[v0] API request failed:", response.status)
            return
          }

          const data = await response.json()

          if (!data.walletAddress) {
            console.error("[v0] No wallet address in API response")
            return
          }

          const walletAddr = data.walletAddress
          console.log("[v0] ✅ Wallet address:", walletAddr.slice(0, 10) + "...")
          setAddress(walletAddr)

          // Create signer from Frame SDK
          const ethProvider = sdk.wallet.ethProvider
          if (!ethProvider) {
            console.error("[v0] Frame SDK eth provider not available")
            return
          }

          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(ethProvider)
          const frameSigner = await provider.getSigner(walletAddr)
          console.log("[v0] ✅ Frame SDK signer created")

          setSigner(frameSigner)
          ;(window as any).__frameSigner = frameSigner

          // Set profile
          const profile: FarcasterUser = {
            fid,
            username,
            displayName,
            pfpUrl,
            walletAddress: walletAddr,
          }
          console.log("[v0] ✅ Profile set:", profile.username)
          setFarcasterUser(profile)
        } catch (error) {
          console.error("[v0] Miniapp authentication error:", error)
        }
      }, 2000)
    } catch (error) {
      console.error("[v0] Miniapp initialization error:", error)
    }
  }

  async function fetchMiniappProfile(walletAddr: string) {
    console.log("[v0] Fetching miniapp profile...")

    try {
      const { sdk } = await import("@farcaster/frame-sdk")

      try {
        const context = sdk.context

        if (context?.user) {
          console.log("[v0] Extracting profile from SDK context...")

          // Extract each property individually to avoid conversion errors
          let fid = 0
          let username = ""
          let displayName = ""
          let pfpUrl = ""

          try {
            fid = Number(context.user.fid)
          } catch (e) {
            console.log("[v0] Could not extract FID")
          }

          try {
            username = String(context.user.username || "")
          } catch (e) {
            console.log("[v0] Could not extract username")
          }

          try {
            displayName = String(context.user.displayName || username)
          } catch (e) {
            console.log("[v0] Could not extract displayName")
          }

          try {
            pfpUrl = String(context.user.pfpUrl || "")
          } catch (e) {
            console.log("[v0] Could not extract pfpUrl")
          }

          if (fid > 0 && username) {
            const profile: FarcasterUser = {
              fid,
              username,
              displayName: displayName || username,
              pfpUrl: pfpUrl || "/abstract-profile.png",
              walletAddress: walletAddr,
            }
            console.log("[v0] ✅ Profile from SDK:", profile)
            setFarcasterUser(profile)
            return
          }
        }
      } catch (sdkError) {
        console.log("[v0] SDK context extraction failed:", sdkError)
      }

      console.log("[v0] Fetching profile from API...")
      const response = await fetch(`/api/farcaster/user?address=${walletAddr}`)
      if (response.ok) {
        const data = await response.json()
        if (data.fid && data.fid > 0) {
          const profile: FarcasterUser = {
            fid: data.fid,
            username: data.username || "user",
            displayName: data.displayName || data.username || "User",
            pfpUrl: data.pfpUrl || "/abstract-profile.png",
            walletAddress: walletAddr,
          }
          console.log("[v0] ✅ Profile from API:", profile)
          setFarcasterUser(profile)
          return
        }
      }

      console.log("[v0] Using minimal profile")
      setFarcasterUser({
        fid: 0,
        username: `user-${walletAddr.slice(0, 6)}`,
        displayName: `User ${walletAddr.slice(0, 6)}`,
        pfpUrl: "/abstract-profile.png",
        walletAddress: walletAddr,
      })
    } catch (error) {
      console.error("[v0] Profile fetch error:", error)
    }
  }

  async function connectWallet() {
    if (isMiniapp) {
      console.log("[v0] Miniapp wallet is auto-connected")
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

      console.log("[v0] ✅ Web wallet connected:", address.slice(0, 10) + "...")
      setAddress(address)
      setSigner(signer)
      ;(window as any).__webSigner = signer
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    }
  }

  function disconnectWallet() {
    setAddress(null)
    setSigner(null)
    ;(window as any).__webSigner = null
    ;(window as any).__frameSigner = null
  }

  async function connectFarcaster() {
    if (isMiniapp) {
      console.log("[v0] Miniapp Farcaster is auto-connected")
      return
    }

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
    setFarcasterUser(null)
    localStorage.removeItem("farcaster_user")
  }

  async function ensureSigner(): Promise<any> {
    console.log("[v0] ensureSigner called")

    if (signer) {
      console.log("[v0] Signer already available")
      return signer
    }

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
          throw new Error("Failed to setup Frame SDK signer. Please refresh the miniapp.")
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
