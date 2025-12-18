"use client";

import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck } from "lucide-react";

export function UnifiedConnectButton() {
  const { user, isLoaded } = useFarcaster();

  // 1. Tampilan saat loading SDK
  if (!isLoaded) {
    return (
      <Button disabled size="sm" variant="outline" className="rounded-full animate-pulse">
        Initializing...
      </Button>
    );
  }

  // 2. Tampilan jika User sudah login otomatis (Farcaster Context tersedia)
  if (user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 border-purple-200 rounded-full bg-purple-50 hover:bg-purple-50 cursor-default"
      >
        <div className="h-5 w-5 rounded-full bg-purple-200 flex items-center justify-center overflow-hidden">
          {user.pfpUrl ? (
            <img src={user.pfpUrl} alt="pfp" className="h-full w-full object-cover" />
          ) : (
            <User className="h-3 w-3 text-purple-700" />
          )}
        </div>
        <span className="font-bold text-purple-700">
          @{user.username || user.displayName}
        </span>
        <ShieldCheck className="h-3 w-3 text-purple-500" />
      </Button>
    );
  }

  // 3. Tampilan jika dibuka di luar Warpcast (Guest Mode)
  return (
    <Button 
      size="sm" 
      variant="secondary"
      className="gap-2 rounded-full"
      onClick={() => window.open("https://warpcast.com", "_blank")}
    >
      Open in Warpcast
    </Button>
  );
}
