"use client";

import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";

export function ConnectFarcasterButton() {
  const { user, isLoaded } = useFarcaster();

  if (!isLoaded) return <Button disabled size="sm">Loading...</Button>;

  if (user) {
    return (
      <div className="flex items-center gap-2 border rounded-full pl-1 pr-3 py-1 bg-white">
        <img 
          src={user.pfpUrl} 
          alt={user.username} 
          className="w-7 h-7 rounded-full border shadow-sm"
        />
        <span className="text-xs font-medium">@{user.username}</span>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline">
      Open in Warpcast
    </Button>
  );
}
