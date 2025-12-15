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
    console.log("[v0] Wagmi state changed:", { wagmiConnected, wagmiAddress })

    if (wagmiConnected && wagmiAddress) {
      console.log("[v0] Wagmi connected with address:", wagmiAddress)
      setAddress(wagmiAddress)
      setChainId(8453) // Base Mainnet

      const setupSigner = async () => {
        try {
          const frameProvider = (window as any).__frameEthProvider
          if (frameProvider) {
            console.log("[v0] Setting up signer from Frame SDK provider...")
            const { BrowserProvider } = await import("ethers")
            const provider = new BrowserProvider(frameProvider)
            const frameSigner = await provider.getSigner()
            setSigner(frameSigner)
            console.log("[v0] Frame SDK signer ready")
          }
        } catch (error) {
          console.error("[v0] Error setting up Frame signer:", error)
        }
      }

      setupSigner()

      console.log("[v0] Calling fetchFarcasterUserFromWallet...")
      fetchFarcasterUserFromWallet(wagmiAddress)
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

      try {
        const ethProvider = sdk.wallet.ethProvider
        ;(window as any).__frameEthProvider = ethProvider
        console.log("[v0] Frame eth provider stored")
      } catch (err) {
        console.log("[v0] Could not get eth provider:", err)
      }

      setTimeout(async () => {
        const farcasterConnector = connectors.find((c) => c.id === "farcaster")

        if (farcasterConnector && !wagmiConnected) {
          console.log("[v0] Auto-connecting with Farcaster connector...")
          try {
            connect({ connector: farcasterConnector })
            console.log("[v0] Connect call completed")
          } catch (error) {
            console.error("[v0] Auto-connect error:", error)
          }
        }
      }, 1000)
    } catch (error) {
      console.error("[v0] Error initializing miniapp:", error)
    }
  }

  const fetchFarcasterUserFromWallet = async (walletAddr: string) => {
    try {
      console.log("[v0] === fetchFarcasterUserFromWallet START ===")
      console.log("[v0] Fetching Farcaster user for wallet:", walletAddr)

      const sdk = (window as any).__frameSdk
      if (sdk) {
        console.log("[v0] Frame SDK found, attempting to extract context...")
        try {
          await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for context to be ready

          const context = sdk.context
          console.log("[v0] SDK context available:", !!context)

          if (context?.user) {
            const user = context.user
            console.log("[v0] Got user from SDK context")
            console.log("[v0] User FID:", user.fid)
            console.log("[v0] User username:", user.username)

            const farcasterUser: FarcasterUser = {
              fid: user.fid || 0,
              username: user.username || `fid-${user.fid}`,
              displayName: user.displayName || user.username || `User ${user.fid}`,
              pfpUrl: user.pfpUrl || "/abstract-profile.png",
              walletAddress: walletAddr,
            }

            console.log("[v0] Setting Farcaster user from SDK:", farcasterUser.username)
            setFarcasterUser(farcasterUser)
            localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
            console.log("[v0] === fetchFarcasterUserFromWallet SUCCESS (SDK) ===")
            return
          } else {
            console.log("[v0] SDK context.user not available")
          }
        } catch (sdkError) {
          console.log("[v0] Could not extract from SDK context:", sdkError)
        }
      } else {
        console.log("[v0] Frame SDK not found in window")
      }

      console.log("[v0] Fetching from Neynar API...")
      const response = await fetch(`/api/farcaster/user?address=${walletAddr}`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Got user from Neynar API - FID:", data.fid)

        const farcasterUser: FarcasterUser = {
          fid: data.fid || 0,
          username: data.username || "user",
          displayName: data.displayName || data.username || "User",
          pfpUrl: data.pfpUrl || "/abstract-profile.png",
          walletAddress: walletAddr,
        }

        console.log("[v0] Setting Farcaster user from API:", farcasterUser.username)
        setFarcasterUser(farcasterUser)
        localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
        console.log("[v0] === fetchFarcasterUserFromWallet SUCCESS (API) ===")
      } else {
        console.log("[v0] Neynar API failed with status:", response.status)
        const errorText = await response.text()
        console.log("[v0] Error response:", errorText)
      }
    } catch (error) {
      console.error("[v0] Error fetching Farcaster user:", error)
      console.log("[v0] === fetchFarcasterUserFromWallet FAILED ===")
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
