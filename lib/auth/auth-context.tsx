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
            const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
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
    let walletAddr: string | undefined = undefined // Declare walletAddr variable here

    try {
      // Check if in miniapp (Frame SDK)
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
                walletAddr =
                  neynarData.custodyAddress || neynarData.verifiedAddresses?.[0] || neynarData.custody_address
                if (typeof walletAddr === "string" && walletAddr.length > 0) {
                  console.log("[v0] Wallet from Neynar:", walletAddr)
                }
              }
            } catch (apiError) {
              console.log("[v0] Neynar API not available, using SDK context data")
            }

            const clientWallet = context.client?.walletAddress
            const validClientWallet =
              typeof clientWallet === "string" && clientWallet.length > 0 ? clientWallet : undefined
            const validPfpUrl =
              typeof user.pfpUrl === "string" && user.pfpUrl.length > 0 ? user.pfpUrl : "/abstract-profile.png"
            const farcasterUser: FarcasterUser = {
              fid: user.fid ?? 0,
              username: user.username ?? "user",
              displayName: user.displayName ?? user.username ?? "User",
              pfpUrl: validPfpUrl,
              walletAddress: validClientWallet,
            }

            setFarcasterUser(farcasterUser)
            localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
            if (farcasterUser.walletAddress) {
              console.log("[v0] Farcaster wallet connected:", farcasterUser.walletAddress)
              setAddress(farcasterUser.walletAddress)

              try {
                const { JsonRpcProvider } = await import("ethers")
                const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
                setSigner(provider)
              } catch (error) {
                console.error("[v0] Error creating provider:", error)
              }
            }
            console.log("[v0] Farcaster user connected via SDK")
            return
          }
        } catch (sdkError) {
          console.error("[v0] Frame SDK error:", sdkError)
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
        console.log("[v0] Detected miniapp frame, initializing Frame SDK...")

        try {
          const sdk = await import("@farcaster/frame-sdk")
          console.log("[v0] Frame SDK loaded")

          await sdk.default.actions.ready()
          console.log("[v0] Frame SDK ready")

          const context = sdk.default.context
          console.log("[v0] Frame SDK context obtained")

          let walletAddr: string | undefined = undefined

          try {
            const ethProvider = sdk.default.wallet.ethProvider
            console.log("[v0] Got Frame eth provider")

            const accounts = await ethProvider.request({ method: "eth_requestAccounts" })
            console.log("[v0] Requested accounts:", accounts)

            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
              const addr = accounts[0]
              if (typeof addr === "string" && addr.length > 0) {
                walletAddr = addr
                console.log("[v0] Wallet address from Frame SDK:", walletAddr)
              }
            }

            if (ethProvider && typeof window !== "undefined") {
              ;(window as any).__frameEthProvider = ethProvider
              console.log("[v0] Frame eth provider stored globally for transactions")
            }
          } catch (providerError) {
            console.log("[v0] Could not access Frame wallet provider:", providerError)
          }

          if (!walletAddr && context?.user?.fid) {
            try {
              console.log("[v0] Fetching wallet from Neynar API for FID:", context.user.fid)
              const response = await fetch(`/api/farcaster/user?fid=${context.user.fid}`)
              if (response.ok) {
                const neynarData = await response.json()
                const neynarWallet =
                  neynarData.custodyAddress || neynarData.verifiedAddresses?.[0] || neynarData.custody_address
                if (typeof neynarWallet === "string" && neynarWallet.length > 0) {
                  walletAddr = neynarWallet
                  console.log("[v0] Wallet from Neynar API:", walletAddr)
                }
              }
            } catch (apiError) {
              console.log("[v0] Neynar API error:", apiError)
            }
          }

          if (context?.user) {
            const farcasterUser: FarcasterUser = {
              fid: context.user.fid ?? 0,
              username: context.user.username ?? "user",
              displayName: context.user.displayName ?? context.user.username ?? "User",
              pfpUrl:
                typeof context.user.pfpUrl === "string" && context.user.pfpUrl.length > 0
                  ? context.user.pfpUrl
                  : "/abstract-profile.png",
              walletAddress: walletAddr,
            }

            console.log("[v0] Setting Farcaster user with wallet:", walletAddr)
            setFarcasterUser(farcasterUser)
            localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))

            if (farcasterUser.walletAddress) {
              setAddress(farcasterUser.walletAddress)

              try {
                const { JsonRpcProvider } = await import("ethers")
                const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
                setSigner(provider)
                console.log("[v0] Created read-only provider for balance checks")
              } catch (providerError) {
                console.error("[v0] Error creating provider:", providerError)
              }
            }

            console.log("[v0] Farcaster miniapp connection complete")
          } else {
            console.log("[v0] No user found in Frame SDK context")
          }
        } catch (error) {
          console.error("[v0] Frame SDK initialization error:", error)
        }
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
