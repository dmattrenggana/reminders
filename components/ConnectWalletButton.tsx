'use client'

import { useMiniApp } from '@neynar/react'
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
  const { isSDKLoaded, context } = useMiniApp()

  // Loading state
  if (!isSDKLoaded) {
    return (
      <Button variant={variant} size={size} className={className} disabled {...props}>
        Loading...
      </Button>
    )
  }

  // User sudah login - tampilkan profile
  if (context?.user) {
    const { username, pfp_url } = context.user

    return (
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        {...props}
      >
        <img
          src={pfp_url}
          alt={username}
          className="h-5 w-5 rounded-full object-cover"
        />
        <span>@{username}</span>
      </Button>
    )
  }

  // User belum login - tampilkan connect button
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
