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

    if (typeof window !== "undefined" && window.self !== window.top) {
      initMiniapp()
    }
  }, [])

  const initMiniapp = async () => {
    try {
      console.log("[v0] Miniapp detected, initializing Frame SDK...")
      const { sdk } = await import("@farcaster/frame-sdk")

      sdk.actions.ready({})
      console.log("[v0] Frame SDK ready() called")
      ;(window as any).__frameSdk = sdk

      setTimeout(async () => {
        console.log("[v0] Attempting auto-connect...")
        try {
          await autoConnectFrameSDK(sdk)
        } catch (error) {
          console.log("[v0] Auto-connect failed, user can manually connect")
        }
      }, 1500)
    } catch (error) {
      console.error("[v0] Error initializing miniapp:", String(error))
    }
  }

  const autoConnectFrameSDK = async (sdk: any) => {
    try {
      if (!sdk || !sdk.context) {
        throw new Error("SDK context not available")
      }

      let userFid = 0
      let userName = ""
      let userDisplay = ""
      let userPfp = ""

      try {
        const contextStr = JSON.stringify(sdk.context)
        const contextObj = JSON.parse(contextStr)

        if (contextObj.user) {
          userFid = Number(contextObj.user.fid) || 0
          userName = String(contextObj.user.username || "")
          userDisplay = String(contextObj.user.displayName || "")
          userPfp = String(contextObj.user.pfpUrl || "")
        }
      } catch (serializeError) {
        throw new Error("SDK context not ready for serialization")
      }

      if (userFid === 0) {
        throw new Error("No valid user FID")
      }

      console.log("[v0] User data extracted - FID:", userFid)

      const validUsername = userName || userDisplay || `fid-${userFid}`
      const validDisplayName = userDisplay || userName || `User ${userFid}`
      const validPfpUrl = userPfp || "/abstract-profile.png"

      let walletAddr: string | undefined = undefined

      try {
        const provider = await sdk.wallet.getEthereumProvider()
        ;(window as any).__frameEthProvider = provider

        const accounts = await provider.request({
          method: "eth_accounts",
          params: [],
        })

        if (accounts && accounts.length > 0) {
          walletAddr = String(accounts[0])
          console.log("[v0] Got wallet from SDK")
        }
      } catch (walletError) {
        console.log("[v0] No wallet from SDK, will try Neynar")
      }

      if (!walletAddr && userFid > 0) {
        try {
          const response = await fetch(`/api/farcaster/user?fid=${userFid}`)
          if (response.ok) {
            const neynarData = await response.json()
            walletAddr = neynarData.custodyAddress || neynarData.verifiedAddresses?.[0] || neynarData.custody_address
            if (walletAddr) {
              console.log("[v0] Got wallet from Neynar")
            }
          }
        } catch (apiError) {
          console.log("[v0] Neynar API call failed")
        }
      }

      const farcasterUser: FarcasterUser = {
        fid: userFid,
        username: validUsername,
        displayName: validDisplayName,
        pfpUrl: validPfpUrl,
        walletAddress: walletAddr,
      }

      setFarcasterUser(farcasterUser)
      localStorage.setItem("farcaster_user", JSON.stringify(farcasterUser))
      console.log("[v0] Farcaster user set successfully")

      if (walletAddr) {
        setAddress(walletAddr)

        try {
          const frameProvider = (window as any).__frameEthProvider
          if (frameProvider) {
            const { BrowserProvider } = await import("ethers")
            const provider = new BrowserProvider(frameProvider)
            const signer = await provider.getSigner()
            setSigner(signer)
            setChainId(8453)
            console.log("[v0] Signer created with Frame provider")
          } else {
            const { JsonRpcProvider } = await import("ethers")
            const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL!)
            setSigner(provider)
            setChainId(8453)
            console.log("[v0] Read-only provider created")
          }
        } catch (providerError) {
          console.log("[v0] Provider setup error")
        }
      }

      console.log("[v0] Auto-connect complete!")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.log("[v0] Auto-connect error:", errorMsg)
      throw error
    }
  }

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

          try {
            const { JsonRpcProvider } = await import("ethers")
            const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL!)
            setSigner(provider)
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
      if (typeof window !== "undefined" && window.self !== window.top) {
        console.log("[v0] Miniapp detected, connecting with Frame SDK...")

        try {
          let sdk = (window as any).__frameSdk
          if (!sdk) {
            const module = await import("@farcaster/frame-sdk")
            sdk = module.sdk
          }

          console.log("[v0] Frame SDK loaded")

          if (!sdk.context || !sdk.context.user) {
            console.log("[v0] SDK context not ready yet, will use Connect button")
            alert("Please click the Connect button to authenticate with Farcaster")
            return
          }

          const userFid = Number(sdk.context.user.fid || 0)
          if (userFid === 0) {
            throw new Error("No valid user FID from Frame SDK")
          }

          let userName = ""
          let userDisplay = ""
          let userPfp = ""

          try {
            userName = String(sdk.context.user.username || "")
          } catch (e) {
            userName = ""
          }
          try {
            userDisplay = String(sdk.context.user.displayName || "")
          } catch (e) {
            userDisplay = ""
          }
          try {
            userPfp = String(sdk.context.user.pfpUrl || "")
          } catch (e) {
            userPfp = ""
          }

          console.log("[v0] Extracted user data - FID:", userFid)

          let walletAddr: string | undefined = undefined

          try {
            const provider = await sdk.wallet.getEthereumProvider()
            ;(window as any).__frameEthProvider = provider

            const accounts = await provider.request({
              method: "eth_accounts",
              params: [],
            })

            if (accounts && accounts.length > 0) {
              walletAddr = String(accounts[0])
              console.log("[v0] Got wallet from SDK provider")
            }
          } catch (walletError) {
            console.log("[v0] Could not get wallet from SDK, will try Neynar")
          }

          if (!walletAddr && userFid > 0) {
            try {
              const response = await fetch(`/api/farcaster/user?fid=${userFid}`)
              if (response.ok) {
                const neynarData = await response.json()
                walletAddr =
                  neynarData.custodyAddress || neynarData.verifiedAddresses?.[0] || neynarData.custody_address
                if (walletAddr) {
                  console.log("[v0] Got wallet from Neynar")
                }
              }
            } catch (apiError) {
              console.log("[v0] Neynar API not available")
            }
          }

          const validUsername = userName || userDisplay || `fid-${userFid}`
          const validDisplayName = userDisplay || userName || `User ${userFid}`
          const validPfpUrl = userPfp || "/abstract-profile.png"

          const farcasterUser: FarcasterUser = {
            fid: userFid,
            username: validUsername,
            displayName: validDisplayName,
            pfpUrl: validPfpUrl,
            walletAddress: walletAddr,
          }

          console.log("[v0] Farcaster user created successfully")

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
                setChainId(8453) // Base Mainnet
                console.log("[v0] Wallet signer created")
              } else {
                const { JsonRpcProvider } = await import("ethers")
                const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL!)
                setSigner(provider)
                setChainId(8453)
                console.log("[v0] Read-only provider created")
              }
            } catch (providerError) {
              console.log("[v0] Provider setup failed, using fallback")
            }
          }

          console.log("[v0] Frame SDK connection complete")
          return
        } catch (sdkError) {
          const errorMsg = sdkError instanceof Error ? sdkError.message : "Unknown error"
          console.log("[v0] Frame SDK error:", errorMsg)
          alert("Please click the Connect button to authenticate with Farcaster")
          return
        }
      }

      console.log("[v0] Opening Farcaster web auth...")
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remindersbase.vercel.app"

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
