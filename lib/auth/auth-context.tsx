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
        setFarcasterUser(user)

        // If Farcaster user has wallet, set it as address
        if (user.walletAddress) {
          console.log("[v0] Restored Farcaster wallet:", user.walletAddress)
          setAddress(user.walletAddress)

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
                const farcasterUser: FarcasterUser = {
                  fid: neynarData.fid,
                  username: neynarData.username,
                  displayName: neynarData.displayName,
                  pfpUrl: neynarData.pfpUrl,
                  walletAddress:
                    neynarData.custodyAddress || neynarData.verifiedAddresses?.[0] || neynarData.custody_address,
                }
                setFarcasterUser(farcasterUser)
                localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
                if (farcasterUser.walletAddress) {
                  setAddress(farcasterUser.walletAddress)

                  try {
                    const { JsonRpcProvider } = await import("ethers")
                    const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
                    setSigner(provider)
                  } catch (error) {
                    console.error("[v0] Error creating provider:", error)
                  }
                }
                console.log("[v0] Farcaster user connected with wallet:", farcasterUser.walletAddress)
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
              walletAddress: context.client?.walletAddress,
            }

            setFarcasterUser(farcasterUser)
            localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
            if (farcasterUser.walletAddress) {
              setAddress(farcasterUser.walletAddress)

              try {
                const { JsonRpcProvider } = await import("ethers")
                const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
                setSigner(provider)
              } catch (error) {
                console.error("[v0] Error creating provider:", error)
              }
            }
            console.log("[v0] Farcaster user connected via SDK with wallet:", farcasterUser.walletAddress)
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

          const farcasterUser: FarcasterUser = {
            fid: userData.fid,
            username: userData.username,
            displayName: userData.displayName,
            pfpUrl: userData.pfpUrl,
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

        setTimeout(async () => {
          try {
            const sdk = await import("@farcaster/frame-sdk")

            console.log("[v0] Calling sdk.actions.ready()...")
            await sdk.default.actions.ready()
            console.log("[v0] SDK ready signal sent")

            const context = await sdk.default.context
            console.log("[v0] Full Frame SDK context:", JSON.stringify(context, null, 2))

            if (context?.user) {
              console.log("[v0] Frame SDK user found:", context.user)

              let walletAddr = null

              // Method 1: From context.client
              if (context.client) {
                walletAddr =
                  context.client.walletAddress ||
                  context.client.ethProvider?.selectedAddress ||
                  context.client.ethProvider?.address

                console.log("[v0] Wallet from context.client:", walletAddr)
              }

              // Method 2: Request from eth provider
              if (!walletAddr && context.client?.ethProvider) {
                try {
                  const accounts = await context.client.ethProvider.request({ method: "eth_accounts" })
                  if (accounts && accounts.length > 0) {
                    walletAddr = accounts[0]
                    console.log("[v0] Wallet from eth_accounts:", walletAddr)
                  }
                } catch (err) {
                  console.log("[v0] eth_accounts error:", err)
                }
              }

              console.log("[v0] Final wallet address extracted:", walletAddr)

              try {
                const response = await fetch(`/api/farcaster/user?fid=${context.user.fid}`)
                if (response.ok) {
                  const neynarData = await response.json()
                  const farcasterUser: FarcasterUser = {
                    fid: neynarData.fid,
                    username: neynarData.username,
                    displayName: neynarData.displayName,
                    pfpUrl: neynarData.pfpUrl,
                    walletAddress: walletAddr || neynarData.custodyAddress || neynarData.verifiedAddresses?.[0],
                  }

                  setFarcasterUser(farcasterUser)
                  localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))

                  if (farcasterUser.walletAddress) {
                    console.log("[v0] Setting wallet address:", farcasterUser.walletAddress)
                    setAddress(farcasterUser.walletAddress)

                    if (typeof window !== "undefined") {
                      ;(window as any).__frameSDK = sdk.default
                      ;(window as any).__frameContext = context
                    }

                    const { JsonRpcProvider } = await import("ethers")
                    const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
                    setSigner(provider)
                  }

                  console.log("[v0] Auto-connect successful with Farcaster user:", farcasterUser)
                  return
                }
              } catch (apiError) {
                console.error("[v0] Neynar API error:", apiError)
              }

              const farcasterUser: FarcasterUser = {
                fid: context.user.fid ?? 0,
                username: context.user.username ?? "user",
                displayName: context.user.displayName ?? context.user.username ?? "User",
                pfpUrl: context.user.pfpUrl ?? "/abstract-profile.png",
                walletAddress: walletAddr,
              }

              setFarcasterUser(farcasterUser)
              localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))

              if (farcasterUser.walletAddress) {
                setAddress(farcasterUser.walletAddress)

                if (typeof window !== "undefined") {
                  ;(window as any).__frameSDK = sdk.default
                  ;(window as any).__frameContext = context
                }

                const { JsonRpcProvider } = await import("ethers")
                const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!)
                setSigner(provider)
              }

              console.log("[v0] Auto-connect successful via SDK:", farcasterUser)
            } else {
              console.log("[v0] No user found in Frame SDK context")
            }
          } catch (error) {
            console.error("[v0] Frame SDK initialization error:", error)
          }
        }, 3000) // Increased to 3 seconds for web miniapp
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
