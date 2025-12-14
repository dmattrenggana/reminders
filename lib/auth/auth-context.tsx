"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  custody?: string
  verifications?: string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)

  const isConnected = !!address
  const isFarcasterConnected = !!farcasterUser

  useEffect(() => {
    checkWalletConnection()
    checkFarcasterConnection()
    autoConnectMiniapp()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAddress(accounts[0])
        }
      }

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(Number.parseInt(chainIdHex, 16))
        window.location.reload()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

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
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const checkFarcasterConnection = () => {
    const stored = localStorage.getItem("farcaster_user")
    if (stored) {
      try {
        setFarcasterUser(JSON.parse(stored))
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

      if (Number(network.chainId) !== 84532) {
        await switchNetwork(84532)
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
      if (typeof window !== "undefined" && window.parent !== window) {
        try {
          const sdk = await import("@farcaster/frame-sdk")
          const context = await sdk.default.context

          if (context?.user) {
            const user = context.user

            // Try to fetch enriched data from Neynar API
            try {
              const response = await fetch(`/api/farcaster/user?fid=${user.fid}`)
              if (response.ok) {
                const neynarData = await response.json()
                const farcasterUser: FarcasterUser = {
                  fid: neynarData.fid,
                  username: neynarData.username,
                  displayName: neynarData.displayName,
                  pfpUrl: neynarData.pfpUrl,
                }
                setFarcasterUser(farcasterUser)
                localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
                console.log("[v0] Farcaster user connected via SDK:", farcasterUser)
                return
              }
            } catch (apiError) {
              console.log("[v0] Neynar API not available, using SDK context data")
            }

            // Use SDK context data directly
            const farcasterUser: FarcasterUser = {
              fid: user.fid ?? 0,
              username: user.username ?? "user",
              displayName: user.displayName ?? user.username ?? "User",
              pfpUrl: user.pfpUrl ?? "/abstract-profile.png",
            }

            setFarcasterUser(farcasterUser)
            localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
            console.log("[v0] Farcaster user connected via SDK context:", farcasterUser)
            return
          }
        } catch (sdkError) {
          console.error("[v0] Frame SDK error:", sdkError)
        }
      }

      alert("Please open this app in Warpcast to connect with Farcaster, or connect with your wallet instead.")
    } catch (error) {
      console.error("Error connecting Farcaster:", error)
      alert("Failed to connect with Farcaster. Please try again.")
    }
  }

  const disconnectFarcaster = () => {
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
                chainName: "Base Sepolia",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
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

  const autoConnectMiniapp = async () => {
    if (typeof window !== "undefined" && !farcasterUser) {
      const inFrame = window.self !== window.top

      if (inFrame) {
        // Wait for Frame SDK to be ready before auto-connecting
        setTimeout(async () => {
          try {
            const sdk = await import("@farcaster/frame-sdk")
            const context = await sdk.default.context

            if (context?.user) {
              console.log("[v0] Auto-connecting Farcaster miniapp user")
              await connectFarcaster()
            }
          } catch (error) {
            console.log("[v0] Frame SDK not available for auto-connect")
          }
        }, 1500)
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
