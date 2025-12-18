"use client";

import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";

export function ConnectWalletButton() {
  const { user, isLoaded } = useFarcaster();

  if (!isLoaded) return <Button disabled size="sm" variant="outline">Loading...</Button>;

  if (user) {
    return (
      <Button variant="outline" size="sm" className="rounded-full pointer-events-none">
        {user.username ? `@${user.username}` : "Connected"}
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={() => window.open("https://warpcast.com", "_blank")}>
      Use Warpcast
    </Button>
  );
}
