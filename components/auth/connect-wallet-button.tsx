"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, LogOut } from "lucide-react";
import { findFarcasterConnector, findBaseAppConnector, detectEnvironment } from "@/lib/utils/farcaster-connector";

export function ConnectWalletButton() {
  const { user, isLoaded, isMiniApp } = useFarcaster();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [imageError, setImageError] = useState(false);

  // Get user info from Farcaster
  const username = user?.username || user?.displayName;
  const pfpUrl = user?.pfpUrl || user?.pfp;

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.preventDefault();
    e.stopPropagation();
    setImageError(true);
    // Suppress error to prevent console noise
    return false;
  };

  /**
   * Handle manual wallet connection
   * Supports: Browser, Farcaster Miniapp, BaseApp
   * 
   * Per Farcaster docs: https://miniapps.farcaster.xyz/docs/guides/wallets
   * "It's possible a user doesn't have a connected wallet so you should always check 
   * for a connection and prompt them to connect if they aren't already connected."
   * 
   * Note: In miniapp/BaseApp, the client handles wallet selection - no dialog needed
   */
  const handleConnect = () => {
    console.log("[ConnectWallet] Manual connect requested");
    console.log("[ConnectWallet] Available connectors:", 
      connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
    );
    
    const currentEnv = detectEnvironment();
    
    if (currentEnv === 'farcaster-miniapp' || currentEnv === 'base-app') {
      // Try environment-specific connector first
      let connector: any = null;
      
      if (currentEnv === 'base-app') {
        connector = findBaseAppConnector(connectors) || findFarcasterConnector(connectors);
      } else {
        connector = findFarcasterConnector(connectors);
      }
      
      if (connector) {
        console.log("[ConnectWallet] ✅ Found connector:", {
          id: connector.id,
          name: connector.name,
          type: connector.type,
          environment: currentEnv
        });
        
        // Miniapp/BaseApp client will handle wallet connection
        connect({ connector });
      } else {
        // Fallback to injected if no miniapp connector found
        console.log("[ConnectWallet] Miniapp connector not found, using injected connector");
        const injectedConnector = connectors.find((c) => c.id === "injected");
        connect({ connector: injectedConnector || connectors[0] });
      }
    } else {
      // Browser mode - use injected connector (MetaMask, etc)
      console.log("[ConnectWallet] Browser mode - using injected connector");
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
        className="flex items-center gap-2 rounded-full h-10 bg-white shadow-sm border border-slate-200 text-xs font-black px-4 text-slate-700 hover:text-red-500 transition-colors"
      >
        {pfpUrl && !imageError ? (
          <img 
            src={pfpUrl} 
            alt={username || "User"} 
            className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-50" 
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
        ) : (
          <Wallet className="h-4 w-4 text-indigo-500" />
        )}
        <span>
          {username ? `@${username}` : (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected")}
        </span>
        <LogOut className="h-3 w-3 opacity-50" />
      </Button>
    );
  }

  // State 3: Wallet belum terhubung
  // Di Farcaster miniapp, jika user sudah login tapi wallet belum connect, tampilkan user info
  if (isMiniApp && user && !isConnected) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 rounded-full bg-[#4f46e5] hover:opacity-90 h-10 px-5 font-bold text-white shadow-lg shadow-[#4f46e5]/30 transition-all active:scale-95"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            {pfpUrl && !imageError && (
              <img 
                src={pfpUrl} 
                alt={username || "User"} 
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" 
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            )}
            <span>{username ? `Connect @${username}` : "Connect Wallet"}</span>
          </>
        )}
      </Button>
    );
  }

  // State 3: Wallet belum terhubung (Web browser atau no user)
  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 rounded-full bg-[#4f46e5] hover:opacity-90 h-10 px-6 font-bold text-white shadow-lg shadow-[#4f46e5]/30 transition-all active:scale-95"
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </Button>
  );
}
