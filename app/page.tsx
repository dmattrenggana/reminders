'use client'

import { UnifiedConnectButton } from '@/components/auth/unified-connect-button'
import { useAuth } from '@/lib/auth/auth-context'

export default function Page() {
  const { isAuthenticated, walletAddress, farcasterUser } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reminders</h1>
          <UnifiedConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-4">Welcome to Reminders</h2>
            <p className="text-muted-foreground mb-8">
              Connect your wallet or Farcaster account to get started
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">Account Info</h3>
              {farcasterUser ? (
                <div className="space-y-2">
                  <p><strong>Username:</strong> @{farcasterUser.username}</p>
                  <p><strong>Display Name:</strong> {farcasterUser.displayName}</p>
                  <p><strong>FID:</strong> {farcasterUser.fid}</p>
                </div>
              ) : (
                <p><strong>Wallet:</strong> {walletAddress}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
