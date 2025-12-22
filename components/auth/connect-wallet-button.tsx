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

  /**
   * Handle manual wallet connection
   * Per Farcaster docs: https://miniapps.farcaster.xyz/docs/guides/wallets
   * "It's possible a user doesn't have a connected wallet so you should always check 
   * for a connection and prompt them to connect if they aren't already connected."
   * 
   * Note: In miniapp, Farcaster client handles wallet selection - no dialog needed
   */
  const handleConnect = () => {
    console.log("[ConnectWallet] Manual connect requested");
    console.log("[ConnectWallet] Available connectors:", 
      connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
    );
    
    // Find Farcaster miniapp connector first
    // Per Farcaster docs: connector should be available in miniapp
    const fcConnector = connectors.find((c) => {
      const id = c.id?.toLowerCase();
      const name = c.name?.toLowerCase() || '';
      return (
        id === "farcasterminiapp" ||
        id === "io.farcaster.miniapp" ||
        id === "farcaster" ||
        name.includes("farcaster") ||
        name.includes("miniapp")
      );
    });
    
    if (fcConnector) {
      console.log("[ConnectWallet] ✅ Found Farcaster connector:", {
        id: fcConnector.id,
        name: fcConnector.name,
        type: fcConnector.type
      });
      
      // Per Farcaster docs: "Your Mini App won't need to show a wallet selection dialog"
      // Farcaster client will handle wallet connection
      connect({ connector: fcConnector });
    } else {
      // Fallback untuk web browser (Injected/MetaMask)
      console.log("[ConnectWallet] Farcaster connector not found, using injected connector");
      const injectedConnector = connectors.find((c) => c.id === "injected");
      connect({ connector: injectedConnector || connectors[0] });
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
