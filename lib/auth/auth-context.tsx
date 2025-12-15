"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import type { FarcasterUser } from "./types" // Assuming FarcasterUser is defined in a separate file

interface AuthContextType {
  // Wallet state
  walletAddress: string | null
  address: string | null
  signer: any
  isConnected: boolean
  chainId: number | null

  // Farcaster state
  farcasterUser: FarcasterUser | null
  isFarcasterConnected: boolean

  // Actions
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  connectFarcaster: () => Promise<void>
  disconnectFarcaster: () => void
  switchNetwork: (chainId: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)

  const isConnected = !!address || wagmiConnected
  const isFarcasterConnected = !!farcasterUser

  useEffect(() => {
    checkWalletConnection()
    checkFarcasterConnection()

    if (typeof window !== "undefined" && window.self !== window.top) {
      initMiniapp()
    }
  }, [])

  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      console.log("[v0] Wagmi connected with address:", wagmiAddress)
      setAddress(wagmiAddress)
      setChainId(8453) // Base Mainnet

      setTimeout(() => {
        console.log("[v0] Attempting to fetch Farcaster user...")
        fetchFarcasterUserFromWallet(wagmiAddress)
      }, 500)
    } else if (!wagmiConnected) {
      console.log("[v0] Wagmi disconnected")
      if (!farcasterUser) {
        setAddress(null)
        setSigner(null)
      }
    }
  }, [wagmiConnected, wagmiAddress])

  const initMiniapp = async () => {
    try {
      console.log("[v0] Miniapp detected, initializing Frame SDK...")
      const { sdk } = await import("@farcaster/frame-sdk")

      sdk.actions.ready({})
      console.log("[v0] Frame SDK ready() called")
      ;(window as any).__frameSdk = sdk

      setTimeout(() => {
        console.log("[v0] Checking SDK context availability...")
        const context = sdk.context
        if (context) {
          console.log("[v0] SDK context exists:", !!context.user)
          if (context.user) {
            console.log("[v0] SDK user FID:", context.user.fid)
            console.log("[v0] SDK user username:", context.user.username)
          }
        } else {
          console.log("[v0] SDK context not available yet")
        }
      }, 200)

      setTimeout(async () => {
        const farcasterConnector = connectors.find((c) => c.id === "farcaster")

        if (farcasterConnector && !wagmiConnected) {
          console.log("[v0] Auto-connecting with Farcaster connector...")
          try {
            connect({ connector: farcasterConnector })
            console.log("[v0] Connect call completed")
          } catch (error) {
            console.error("[v0] Auto-connect error:", String(error))
          }
        } else {
          console.log("[v0] Cannot auto-connect:", {
            hasConnector: !!farcasterConnector,
            alreadyConnected: wagmiConnected,
          })
        }
      }, 1000)
    } catch (error) {
      console.error("[v0] Error initializing miniapp:", String(error))
    }
  }

  const fetchFarcasterUserFromWallet = async (walletAddr: string) => {
    try {
      console.log("[v0] Fetching Farcaster user for wallet:", walletAddr)

      const sdk = (window as any).__frameSdk
      console.log("[v0] SDK available:", !!sdk)

      if (sdk?.context?.user) {
        console.log("[v0] SDK context user found, extracting data...")
        const user = sdk.context.user

        let fid = 0
        let username = ""
        let displayName = ""
        let pfpUrl = "/abstract-profile.png"

        try {
          if (typeof user.fid === "number") {
            fid = user.fid
            console.log("[v0] Extracted FID:", fid)
          }
        } catch (e) {
          console.error("[v0] Error extracting FID:", e)
        }

        try {
          if (typeof user.username === "string" && user.username) {
            username = user.username
            console.log("[v0] Extracted username:", username)
          } else {
            username = `fid-${fid}`
          }
        } catch (e) {
          console.error("[v0] Error extracting username:", e)
          username = `fid-${fid}`
        }

        try {
          if (typeof user.displayName === "string" && user.displayName) {
            displayName = user.displayName
            console.log("[v0] Extracted displayName:", displayName)
          } else {
            displayName = username
          }
        } catch (e) {
          console.error("[v0] Error extracting displayName:", e)
          displayName = username
        }

        try {
          if (typeof user.pfpUrl === "string" && user.pfpUrl) {
            pfpUrl = user.pfpUrl
            console.log("[v0] Extracted pfpUrl:", pfpUrl)
          }
        } catch (e) {
          console.error("[v0] Error extracting pfpUrl:", e)
        }

        const farcasterUser: FarcasterUser = {
          fid,
          username,
          displayName,
          pfpUrl,
          walletAddress: walletAddr,
        }

        console.log("[v0] Setting Farcaster user - FID:", fid, "Username:", username, "Display:", displayName)
        setFarcasterUser(farcasterUser)
        localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
        console.log("[v0] Got Farcaster user from SDK context")
        return
      }

      console.log("[v0] No SDK context user, trying Neynar API...")
      const response = await fetch(`/api/farcaster/user?address=${walletAddr}`)
      console.log("[v0] Neynar API status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log(
          "[v0] Neynar API response - FID:",
          data.fid,
          "Username:",
          data.username,
          "Display:",
          data.displayName,
        )

        const farcasterUser: FarcasterUser = {
          fid: data.fid || 0,
          username: data.username || "user",
          displayName: data.displayName || data.username || "User",
          pfpUrl: data.pfpUrl || "/abstract-profile.png",
          walletAddress: walletAddr,
        }

        console.log(
          "[v0] Setting Farcaster user from API - FID:",
          farcasterUser.fid,
          "Username:",
          farcasterUser.username,
        )
        setFarcasterUser(farcasterUser)
        localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
        console.log("[v0] Got Farcaster user from Neynar API")
      } else {
        console.log("[v0] Neynar API returned non-OK status:", response.status)
        const errorText = await response.text()
        console.log("[v0] Error response:", errorText)
      }
    } catch (error) {
      console.error("[v0] Error fetching Farcaster user:", error)
    }
  }

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const { BrowserProvider } = await import("ethers")
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          const address = await signer.getAddress()
          const network = await provider.getNetwork()

          setAddress(address)
          setSigner(signer)
          setChainId(Number(network.chainId))
        }
      } catch (error) {
        console.error("[v0] Error checking wallet connection:", error)
      }
    }
  }

  const checkFarcasterConnection = async () => {
    const stored = localStorage.getItem("farcaster_user")
    if (stored) {
      try {
        const user = JSON.parse(stored)

        const validFid = typeof user.fid === "number" && user.fid > 0 ? user.fid : 0

        if (validFid === 0) {
          localStorage.removeItem("farcaster_user")
          return
        }

        const validUsername = typeof user.username === "string" && user.username.length > 0 ? user.username : "user"

        const validDisplayName =
          typeof user.displayName === "string" && user.displayName.length > 0 ? user.displayName : validUsername

        let validPfpUrl = "/abstract-profile.png"
        if (typeof user.pfpUrl === "string" && user.pfpUrl.length > 0) {
          validPfpUrl = user.pfpUrl
        }

        const validWalletAddr =
          typeof user.walletAddress === "string" && user.walletAddress.length > 0 ? user.walletAddress : undefined

        const validatedUser: FarcasterUser = {
          fid: validFid,
          username: validUsername,
          displayName: validDisplayName,
          pfpUrl: validPfpUrl,
          walletAddress: validWalletAddr,
        }

        setFarcasterUser(validatedUser)

        if (validWalletAddr) {
          console.log("[v0] Restored Farcaster wallet:", validWalletAddr)
          setAddress(validWalletAddr)
        }
      } catch (error) {
        console.error("Error parsing stored Farcaster user:", error)
        localStorage.removeItem("farcaster_user")
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet")
      return
    }

    try {
      const { BrowserProvider } = await import("ethers")
      const provider = new BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      setAddress(address)
      setSigner(signer)
      setChainId(Number(network.chainId))

      if (Number(network.chainId) !== 8453) {
        await switchNetwork(8453)
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      alert("Failed to connect wallet. Please try again.")
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setSigner(null)
    setChainId(null)
  }

  const connectFarcaster = async () => {
    try {
      const isMiniapp = typeof window !== "undefined" && window.self !== window.top

      if (isMiniapp) {
        console.log("[v0] Miniapp detected, connecting with Wagmi...")

        const farcasterConnector = connectors.find((c) => c.id === "farcaster")

        if (!farcasterConnector) {
          throw new Error("Farcaster connector not found")
        }

        console.log("[v0] Connecting with Farcaster connector...")
        connect({ connector: farcasterConnector })

        return
      }

      console.log("[v0] Web environment, using OAuth flow...")
      const width = 500
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const authUrl = `/api/farcaster/auth?returnTo=${encodeURIComponent(window.location.href)}`
      const popup = window.open(authUrl, "Farcaster Sign In", `width=${width},height=${height},left=${left},top=${top}`)

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === "FARCASTER_AUTH_SUCCESS") {
          const userData = event.data.user

          const farcasterUser: FarcasterUser = {
            fid: userData.fid,
            username: userData.username,
            displayName: userData.displayName,
            pfpUrl: userData.pfpUrl || "/abstract-profile.png",
            walletAddress: userData.walletAddress,
          }

          setFarcasterUser(farcasterUser)
          localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))

          if (farcasterUser.walletAddress) {
            setAddress(farcasterUser.walletAddress)
          }

          popup?.close()
          window.removeEventListener("message", handleMessage)
        }
      }

      window.addEventListener("message", handleMessage)

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener("message", handleMessage)
        }
      }, 500)
    } catch (error) {
      console.error("[v0] Error connecting Farcaster:", error)
      alert("Failed to connect with Farcaster. Please try again.")
    }
  }

  const disconnectFarcaster = () => {
    if (wagmiConnected) {
      wagmiDisconnect()
    }

    setFarcasterUser(null)
    localStorage.removeItem("farcaster_user")
  }

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: "Base",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          })
        } catch (addError) {
          console.error("Error adding network:", addError)
        }
      } else {
        console.error("Error switching network:", error)
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        walletAddress: address,
        address,
        signer,
        isConnected,
        chainId,
        farcasterUser,
        isFarcasterConnected,
        connectWallet,
        disconnectWallet,
        connectFarcaster,
        disconnectFarcaster,
        switchNetwork,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
