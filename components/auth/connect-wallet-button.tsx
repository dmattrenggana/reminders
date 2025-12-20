"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";

export function ConnectWalletButton() {
  const { user, isLoaded } = useFarcaster();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    // Cari konektor khusus Farcaster
    const fcConnector = connectors.find((c) => c.id === "farcasterFrame");
    if (fcConnector) {
      connect({ connector: fcConnector });
    } else {
      // Fallback untuk konektor pertama (Injected/MetaMask) jika di luar Farcaster
      connect({ connector: connectors[0] });
    }
  };

  // State 1: Sedang memuat SDK Farcaster
  if (!isLoaded) {
    return (
      <Button disabled size="sm" variant="outline" className="rounded-full h-10 px-6">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-400" />
        Initializing...
      </Button>
    );
  }

  // State 2: Wallet sudah terhubung
  if (isConnected) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => disconnect()} 
        className="rounded-full h-10 bg-white shadow-sm border border-slate-200 text-xs font-black px-5 text-slate-700 hover:text-red-500 transition-colors"
      >
        {user?.username ? `@${user.username}` : (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected")}
      </Button>
    );
  }

  // State 3: Wallet belum terhubung (Tampilan Default Brand Purple)
  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting}
      className="rounded-full bg-[#4f46e5] hover:opacity-90 h-10 px-6 font-bold text-white shadow-lg shadow-[#4f46e5]/30 transition-all active:scale-95"
    >
      {isConnecting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="mr-2 h-4 w-4" />
      )}
      Connect Wallet
    </Button>
  );
}
