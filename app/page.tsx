'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { UnifiedConnectButton } from '@/components/auth/unified-connect-button'

export default function Page() {
  const { isAuthenticated, address, farcasterUser } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Reminders App</h1>
        <UnifiedConnectButton />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {isAuthenticated ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
            {farcasterUser ? (
              <p className="text-muted-foreground">
                Connected as @{farcasterUser.username}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">Welcome to Reminders</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet or Farcaster account to get started
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
