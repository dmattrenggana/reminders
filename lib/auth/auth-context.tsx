'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

interface FarcasterUser {
  fid: string
  username: string
  displayName: string
  pfpUrl: string
  verifiedAddress: string
}

interface AuthContextType {
  isAuthenticated: boolean
  address: string | undefined
  farcasterUser: FarcasterUser | null
  isInMiniApp: boolean
  disconnect: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { disconnect: disconnectWallet } = useDisconnect()
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  // Detect Farcaster miniapp
  useEffect(() => {
    const hasFrameProvider = typeof window !== 'undefined' && '__frameEthProvider' in window
    setIsInMiniApp(hasFrameProvider)
  }, [])

  // Parse Farcaster OAuth callback
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const fid = params.get('fid')
    const username = params.get('username')
    const displayName = params.get('displayName')
    const pfpUrl = params.get('pfpUrl')
    const verifiedAddress = params.get('verifiedAddress')

    if (fid && username) {
      setFarcasterUser({
        fid,
        username,
        displayName: displayName || username,
        pfpUrl: pfpUrl || '',
        verifiedAddress: verifiedAddress || '',
      })
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const disconnect = () => {
    disconnectWallet()
    setFarcasterUser(null)
  }

  const isAuthenticated = isConnected || farcasterUser !== null

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        address,
        farcasterUser,
        isInMiniApp,
        disconnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
