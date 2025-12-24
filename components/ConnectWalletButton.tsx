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
}: export function ConnectWalletButton() {
  const { user, isMiniApp } = useFarcaster();

  useEffect(() => {
    // Define callback untuk SIWN
    (window as any).onSignInSuccess = (data: any) => {
      console.log("SIWN success:", data);
      // Simpan user data ke state/localStorage
      localStorage.setItem('siwn_user', JSON.stringify(data.user));
      window.location.reload(); // atau update state
    };
  }, []);

  if (user) {
    return (
      <Button>
        <img src={user.pfpUrl} className="h-5 w-5 rounded-full" />
        <span>@{user.username}</span>
      </Button>
    );
  }

  // SIWN button (HTML)
  return (
    <div
      className="neynar_signin"
      data-client_id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
      data-success-callback="onSignInSuccess"
      data-theme="light"
    />
  );
}
