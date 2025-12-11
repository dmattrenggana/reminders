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
      setFarcasterUser(JSON.parse(stored))
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
      if (typeof window !== "undefined") {
        try {
          const { sdk } = await import("@farcaster/frame-sdk")
          const context = await sdk.context

          if (context?.user) {
            const user = context.user

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
                return
              }
            } catch (apiError) {
              console.log("Neynar API not available, using SDK data only")
            }

            // Fallback to SDK data if Neynar API fails
            const farcasterUser: FarcasterUser = {
              fid: user.fid ?? 0,
              username: user.username ?? "user",
              displayName: user.displayName ?? user.username ?? "User",
              pfpUrl: user.pfpUrl ?? "/abstract-profile.png",
            }

            setFarcasterUser(farcasterUser)
            localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
            return
          }
        } catch (sdkError) {
          console.log("Farcaster SDK not available, trying alternative methods")
        }

        // Fallback: try to get context from window (without accessing parent)
        const frameContext =
          (window as any).farcasterFrameContext ||
          (window as any).farcaster?.context ||
          (window as any).frameContext ||
          (window as any).__frameContext

        if (frameContext?.user) {
          const user = frameContext.user
          const farcasterUser: FarcasterUser = {
            fid: user.fid ?? user.id ?? 0,
            username: user.username ?? "user",
            displayName: user.displayName ?? user.display_name ?? user.username ?? "User",
            pfpUrl: user.pfpUrl ?? user.pfp_url ?? "/abstract-profile.png",
          }

          setFarcasterUser(farcasterUser)
          localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
          return
        }

        const isInFrame = typeof window !== "undefined" && window.self !== window.top
        if (isInFrame) {
          console.log("Running in frame but unable to retrieve Farcaster context")
        }
      }
    } catch (error) {
      console.error("Error connecting Farcaster:", error)
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
    if (typeof window !== "undefined") {
      const inFrame = window.self !== window.top

      // Check for frame context in current window only
      const frameContext =
        (window as any).farcasterFrameContext ||
        (window as any).farcaster?.context ||
        (window as any).frameContext ||
        (window as any).__frameContext

      if ((inFrame || frameContext) && !farcasterUser) {
        await connectFarcaster()
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
