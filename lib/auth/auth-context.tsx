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
  walletAddress?: string
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

        // If no valid fid, clear invalid data and return
        if (validFid === 0) {
          localStorage.removeItem("farcaster_user")
          return
        }

        // Validate username is a string
        const validUsername = typeof user.username === "string" && user.username.length > 0 ? user.username : "user"

        // Validate displayName is a string
        const validDisplayName =
          typeof user.displayName === "string" && user.displayName.length > 0 ? user.displayName : validUsername

        // Validate pfpUrl is a string
        let validPfpUrl = "/abstract-profile.png"
        if (typeof user.pfpUrl === "string" && user.pfpUrl.length > 0) {
          validPfpUrl = user.pfpUrl
        }

        // Validate walletAddress is a string or undefined
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

          // Create a read-only provider for balance checks
          try {
            const { JsonRpcProvider } = await import("ethers")
            const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL!)
            setSigner(provider) // Use provider as signer for read operations
          } catch (error) {
            console.error("[v0] Error creating provider for Farcaster wallet:", error)
          }
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
      // Check if in miniapp (Frame SDK)
      if (typeof window !== "undefined" && window.self !== window.top) {
        console.log("[v0] Connecting in miniapp frame...")

        try {
          const sdk = await import("@farcaster/frame-sdk")
          console.log("[v0] Frame SDK loaded")

          sdk.default.actions.ready()
          await new Promise((resolve) => setTimeout(resolve, 100))

          const context = sdk.default.context

          if (!context?.user?.fid) {
            throw new Error("No user context available from Frame SDK")
          }

          const user = context.user
          let walletAddr: string | undefined = undefined

          // Try to get wallet from ethProvider
          try {
            const ethProvider = sdk.default.wallet?.ethProvider
            if (ethProvider) {
              ;(window as any).__frameEthProvider = ethProvider
              const accounts = (await ethProvider.request({ method: "eth_accounts", params: [] })) as string[]
              if (accounts && accounts.length > 0) {
                walletAddr = accounts[0]
              }
            }
          } catch {
            console.log("[v0] ethProvider not available")
          }

          // Fallback to context.client.walletAddress
          if (!walletAddr) {
            const clientWallet = context.client?.walletAddress
            if (typeof clientWallet === "string" && clientWallet.length > 0) {
              walletAddr = clientWallet
            }
          }

          // Fallback to Neynar API
          if (!walletAddr && user.fid) {
            try {
              const response = await fetch(`/api/farcaster/user?fid=${user.fid}`)
              if (response.ok) {
                const neynarData = await response.json()
                const neynarWallet =
                  neynarData.custodyAddress || neynarData.verifiedAddresses?.[0] || neynarData.custody_address
                if (typeof neynarWallet === "string" && neynarWallet.length > 0) {
                  walletAddr = neynarWallet
                }
              }
            } catch {
              console.log("[v0] Neynar API not available")
            }
          }

          const farcasterUser: FarcasterUser = {
            fid: user.fid,
            username: user.username || `fid-${user.fid}`,
            displayName: user.displayName || user.username || `User ${user.fid}`,
            pfpUrl: typeof user.pfpUrl === "string" && user.pfpUrl.length > 0 ? user.pfpUrl : "/abstract-profile.png",
            walletAddress: walletAddr,
          }

          setFarcasterUser(farcasterUser)
          localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))

          if (farcasterUser.walletAddress) {
            setAddress(farcasterUser.walletAddress)

            try {
              const frameProvider = (window as any).__frameEthProvider
              if (frameProvider) {
                const { BrowserProvider } = await import("ethers")
                const provider = new BrowserProvider(frameProvider)
                const signer = await provider.getSigner()
                setSigner(signer)
                console.log("[v0] Frame signer created")
              } else {
                const { JsonRpcProvider } = await import("ethers")
                const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL!)
                setSigner(provider)
              }
            } catch (error) {
              console.error("[v0] Provider creation error:", error)
            }
          }

          console.log("[v0] Miniapp connection successful")
          return
        } catch (sdkError) {
          console.error("[v0] Frame SDK connection failed:", sdkError)
          throw new Error("Failed to connect with Farcaster miniapp. Please try again.")
        }
      }

      console.log("[v0] Opening Farcaster web auth...")
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"

      // Open Farcaster auth in popup window
      const width = 500
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const authUrl = `/api/farcaster/auth?returnTo=${encodeURIComponent(window.location.href)}`
      const popup = window.open(authUrl, "Farcaster Sign In", `width=${width},height=${height},left=${left},top=${top}`)

      // Listen for auth completion
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === "FARCASTER_AUTH_SUCCESS") {
          const userData = event.data.user
          console.log("[v0] Farcaster web auth successful:", userData)

          const validWalletAddr =
            typeof userData.walletAddress === "string" && userData.walletAddress.length > 0
              ? userData.walletAddress
              : undefined
          const validPfpUrl =
            typeof userData.pfpUrl === "string" && userData.pfpUrl.length > 0
              ? userData.pfpUrl
              : "/abstract-profile.png"
          const farcasterUser: FarcasterUser = {
            fid: userData.fid,
            username: userData.username,
            displayName: userData.displayName,
            pfpUrl: validPfpUrl,
            walletAddress: validWalletAddr,
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

      // Cleanup if popup is closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener("message", handleMessage)
        }
      }, 500)
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
