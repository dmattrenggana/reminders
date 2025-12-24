'use client'

import { useFarcaster } from '@/components/providers/farcaster-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

interface ConnectWalletButtonProps 
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  onConnect?: () => void
}

export function ConnectWalletButton({
  className,
  variant = 'default',
  size = 'default',
  onConnect,
  ...props
}: ConnectWalletButtonProps) {
  const { user, isLoaded, isMiniApp } = useFarcaster()

  if (!isLoaded) {
    return (
      <Button variant={variant} size={size} className={className} disabled {...props}>
        Loading...
      </Button>
    )
  }

  if (user) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        {...props}
      >
        {user.pfpUrl && (
          <img
            src={user.pfpUrl}
            alt={user.username}
            className="h-5 w-5 rounded-full object-cover"
          />
        )}
        <span>@{user.username}</span>
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={onConnect}
      {...props}
    >
      Connect Wallet
    </Button>
  )
}
