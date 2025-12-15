"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { FarcasterUser } from "./types"

/*
  Migration notes:
  - Replaced direct @farcaster/frame-sdk usage with Minikit hooks.
  - We keep the outward API (connectFarcaster, disconnectFarcaster, farcasterUser, isFarcasterConnected)
    so UI components like ConnectFarcasterButton and FarcasterProfileCard continue to work.
  - This file now reads frame context via useMiniKit and authentication via useAuthenticate
    when available (app must be wrapped with OnchainKitProvider).
*/

import { useMiniKit } from "@coinbase/onchainkit/minikit"
import { useAuthenticate } from "@coinbase/onchainkit/minikit"

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

  // OnchainKit / Minikit hooks (app must be wrapped with OnchainKitProvider)
  const { context: miniContext, setFrameReady } = useMiniKit() as any
  const { user: authUser, isAuthenticated } = useAuthenticate() as any

  const isConnected = !!address
  const isFarcasterConnected = !!farcasterUser

  useEffect(() => {
    initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // If Minikit context is available, set frame ready
      try {
        if (setFrameReady) {
          setFrameReady()
        }
        console.log("[v0] Splash screen dismissed (Minikit)")
      } catch (e) {
        console.warn("[v0] setFrameReady unavailable:", e)
      }

      setTimeout(async () => {
        try {
          console.log("[v0] Starting miniapp authentication...")

          // Try to get wallet address from minikit context's ethProvider, fallback to window frame provider
          const ethProvider =
            (miniContext && miniContext.wallet && miniContext.wallet.ethProvider) || (window as any).__frameEthProvider

          if (!ethProvider) {
            console.warn("[v0] No ethProvider found in miniContext")
            return
          }

          const { BrowserProvider } = await import("ethers")
          const provider = new BrowserProvider(ethProvider)

          try {
            const accounts = await provider.send("eth_accounts", [])
            if (accounts && accounts.length > 0) {
              const walletAddress = accounts[0]
              console.log("[v0] Got wallet address:", walletAddress.slice(0, 10) + "...")

              setAddress(walletAddress)

              // Create signer
              const frameSigner = await provider.getSigner(walletAddress)
              setSigner(frameSigner)
              ;(window as any).__frameSigner = frameSigner

              // Try to extract user from Minikit authenticate hook first
              if (authUser && authUser.fid) {
                const profile: FarcasterUser = {
                  fid: Number(authUser.fid) || 0,
                  username: authUser.username || `user-${walletAddress.slice(0, 6)}`,
                  displayName: authUser.displayName || authUser.username || `User ${walletAddress.slice(0, 6)}`,
                  pfpUrl: authUser.pfpUrl || "/abstract-profile.png",
                  walletAddress: walletAddress,
                }
                setFarcasterUser(profile)
                console.log("[v0] ✅ Miniapp authenticated (from useAuthenticate):", profile.username)
                return
              }

              // If Minikit authUser not present, fallback to your existing API fetch
              const response = await fetch(`/api/farcaster/user?address=${walletAddress}`)
              if (response.ok) {
                const data = await response.json()
                if (data.fid && data.fid > 0) {
                  const profile: FarcasterUser = {
                    fid: data.fid,
                    username: data.username || "user",
                    displayName: data.displayName || data.username || "User",
                    pfpUrl: data.pfpUrl || "/abstract-profile.png",
                    walletAddress: walletAddress,
                  }
                  setFarcasterUser(profile)
                  console.log("[v0] ✅ Miniapp authenticated (from API):", profile.username)
                  return
                }
              }

              // Fallback profile if API fails
              setFarcasterUser({
                fid: 0,
                username: `user-${walletAddress.slice(0, 6)}`,
                displayName: `User ${walletAddress.slice(0, 6)}`,
                pfpUrl: "/abstract-profile.png",
                walletAddress: walletAddress,
              })
              console.log("[v0] ✅ Miniapp connected with minimal profile")
            }
          } catch (error) {
            console.error("[v0] Failed to get accounts:", error)
          }
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
      // Try reading Minikit context user first
      if (miniContext?.user) {
        console.log("[v0] Extracting profile from Minikit context...")
        const ctxUser = miniContext.user

        let fid = 0
        let username = ""
        let displayName = ""
        let pfpUrl = ""

        try {
          fid = Number(ctxUser.fid)
        } catch (e) {
          console.log("[v0] Could not extract FID")
        }

        try {
          username = String(ctxUser.username || "")
        } catch (e) {
          console.log("[v0] Could not extract username")
        }

        try {
          displayName = String(ctxUser.displayName || username)
        } catch (e) {
          console.log("[v0] Could not extract displayName")
        }

        try {
          pfpUrl = String(ctxUser.pfpUrl || "")
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
          console.log("[v0] ✅ Profile from Minikit context:", profile)
          setFarcasterUser(profile)
          return
        }
      }

      // Fallback to your existing API
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
      // Minikit in-frame will surface the user automatically (we already populate farcasterUser in initMiniapp)
      console.log("[v0] Miniapp Farcaster is auto-connected (Minikit)")
      return
    }

    // Keep the existing web OAuth popup flow
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
      const frameProvider =
        (miniContext && miniContext.wallet && miniContext.wallet.ethProvider) || (window as any).__frameEthProvider
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
