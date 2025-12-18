"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { User, Wallet } from "lucide-react";

export function UnifiedConnectButton() {
  const { user, fid, isConnected, loading } = useAuth();

  if (loading) return <Button disabled size="sm" className="rounded-full">Checking...</Button>;

  if (isConnected) {
    return (
      <Button variant="outline" size="sm" className="gap-2 border-primary/50 rounded-full bg-primary/5">
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-3 w-3 text-primary" />
        </div>
        <span className="font-bold text-primary">
          {user?.username || `FID: ${fid}`}
        </span>
      </Button>
    );
  }

  return (
    <Button size="sm" className="gap-2 rounded-full">
      <Wallet className="h-4 w-4" />
      Connect
    </Button>
  );
}
