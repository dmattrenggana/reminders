'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

interface FarcasterUser {
  fid: string
  username: string
  displayName: string
  pfpUrl?: string
  verifiedAddress?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  address?: string
  farcasterUser?: FarcasterUser
  isInMiniApp: boolean
  disconnect: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | undefined>()
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  useEffect(() => {
    // Check if running in Farcaster miniapp
    if (typeof window !== 'undefined' && (window as any).__frameEthProvider) {
      setIsInMiniApp(true)
    }

    // Check URL parameters for Farcaster OAuth callback
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
        pfpUrl: pfpUrl || undefined,
        verifiedAddress: verifiedAddress || undefined,
      })
    }
  }, [])

  const disconnect = () => {
    wagmiDisconnect()
    setFarcasterUser(undefined)
  }

  const isAuthenticated = isConnected || !!farcasterUser

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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
