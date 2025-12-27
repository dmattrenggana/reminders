"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { createImageErrorHandler } from "@/lib/utils/image-error-handler";

interface HeaderWalletProps {
  isConnected: boolean;
  formattedBalance: string;
  symbol: string;
  pfpUrl?: string;
  username?: string;
  address?: string;
  isMiniApp: boolean;
  providerUser: any;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function HeaderWallet({
  isConnected,
  formattedBalance,
  symbol,
  pfpUrl,
  username,
  address,
  isMiniApp,
  providerUser,
  onConnect,
  onDisconnect,
}: HeaderWalletProps) {
  const [pfpError, setPfpError] = useState(false);
  const handlePfpError = createImageErrorHandler(setPfpError, { suppressConsole: true });

  if (isConnected) {
    // When wallet is connected, prioritize user info from miniapp
    // Use providerUser data as primary source when in miniapp
    const displayUsername = isMiniApp && providerUser 
      ? (providerUser.username || providerUser.displayName || username)
      : (username || providerUser?.username || providerUser?.displayName);
    
    const displayPfpUrl = isMiniApp && providerUser
      ? (providerUser.pfpUrl || providerUser.pfp || pfpUrl)
      : (pfpUrl || providerUser?.pfpUrl || providerUser?.pfp);
    
    console.log("[HeaderWallet] Connected state:", {
      isConnected,
      isMiniApp,
      hasProviderUser: !!providerUser,
      displayUsername,
      displayPfpUrl,
      username,
      pfpUrl,
      providerUserKeys: providerUser ? Object.keys(providerUser) : []
    });
    
    return (
      <div className="
        inline-flex items-center gap-0 bg-slate-50 p-1 rounded-full 
        border border-slate-200 shadow-sm
      ">
        {/* User Info Section */}
        <div className="
          flex items-center gap-2 h-9 px-3 rounded-full 
          bg-white cursor-pointer transition-all
        "
        onClick={onDisconnect}
        >
          {displayPfpUrl && !pfpError ? (
            <img 
              src={displayPfpUrl} 
              alt="PFP" 
              className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-50" 
              referrerPolicy="no-referrer"
              onError={handlePfpError}
            />
          ) : displayUsername ? (
            <div className="w-6 h-6 rounded-full bg-indigo-300 flex items-center justify-center text-xs font-bold text-indigo-700">
              {displayUsername.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Wallet className="h-4 w-4 text-indigo-500" />
          )}
          <span className="text-xs font-black">
            {displayUsername ? `@${displayUsername}` : `${address?.slice(0, 4)}...`}
          </span>
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        {/* Balance Section */}
        <div className="
          flex items-center gap-1 h-9 px-3 rounded-full 
          bg-white cursor-pointer transition-all
        "
        onClick={onDisconnect}
        >
          <span className="text-xs font-bold text-[#4f46e5] whitespace-nowrap">
            {formattedBalance || "0.00"}
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {symbol || "RMND"}
          </span>
          <LogOut className="h-3 w-3 opacity-20 ml-1" />
        </div>
      </div>
    );
  }

  // Show user info if logged in via Farcaster miniapp (even if wallet not connected)
  // Prioritize providerUser data when in miniapp
  const displayUsernameWhenNotConnected = isMiniApp && providerUser 
    ? (providerUser.username || providerUser.displayName || username)
    : (username || providerUser?.username || providerUser?.displayName);
  
  const displayPfpUrlWhenNotConnected = isMiniApp && providerUser
    ? (providerUser.pfpUrl || providerUser.pfp || pfpUrl)
    : (pfpUrl || providerUser?.pfpUrl || providerUser?.pfp);
  
  const shouldShowUserInfo = isMiniApp && providerUser && (displayUsernameWhenNotConnected || displayPfpUrlWhenNotConnected);

  console.log("[HeaderWallet] Not connected state:", {
    isConnected: false,
    isMiniApp,
    hasProviderUser: !!providerUser,
    displayUsernameWhenNotConnected,
    displayPfpUrlWhenNotConnected,
    username,
    pfpUrl,
    providerUserKeys: providerUser ? Object.keys(providerUser) : []
  });

  return (
    <Button 
      onClick={onConnect} 
      className="
        rounded-full bg-[#4f46e5] hover:opacity-90 font-bold 
        text-white h-12 px-8 shadow-lg transition-all active:scale-95
      "
    >
      {shouldShowUserInfo ? (
        <div className="flex items-center gap-2">
          {displayPfpUrlWhenNotConnected && !pfpError ? (
            <img 
              src={displayPfpUrlWhenNotConnected} 
              alt={displayUsernameWhenNotConnected || "User"} 
              className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30" 
              referrerPolicy="no-referrer"
              onError={handlePfpError}
            />
          ) : displayUsernameWhenNotConnected ? (
            <div className="w-6 h-6 rounded-full bg-indigo-300 flex items-center justify-center text-xs font-bold text-white">
              {displayUsernameWhenNotConnected.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          <span>
            {displayUsernameWhenNotConnected ? `Connect @${displayUsernameWhenNotConnected}` : "Connect Wallet"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </div>
      )}
    </Button>
  );
}
