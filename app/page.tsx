'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { UnifiedConnectButton } from '@/components/auth/unified-connect-button'

export default function Page() {
  const { isAuthenticated, address, farcasterUser } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reminders App</h1>
          <UnifiedConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Welcome to Reminders</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet or Farcaster account to get started
            </p>
          </div>
        ) : (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Your Account</h2>
            {farcasterUser ? (
              <div className="space-y-2">
                <p><strong>Username:</strong> @{farcasterUser.username}</p>
                <p><strong>Display Name:</strong> {farcasterUser.displayName}</p>
                <p><strong>FID:</strong> {farcasterUser.fid}</p>
                {farcasterUser.verifiedAddress && (
                  <p><strong>Verified Address:</strong> {farcasterUser.verifiedAddress}</p>
                )}
              </div>
            ) : (
              <p><strong>Wallet Address:</strong> {address}</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
