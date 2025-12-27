"use client";

import { useEffect } from "react";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderWallet } from "./HeaderWallet";
import { HeaderBuyButton } from "./HeaderBuyButton";

interface HeaderProps {
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

export function Header({
  isConnected,
  formattedBalance,
  symbol,
  pfpUrl,
  username,
  address,
  isMiniApp,
  providerUser,
  onConnect,
  onDisconnect
}: HeaderProps) {
  // Debug logging for miniapp user info
  useEffect(() => {
    if (isMiniApp && providerUser) {
      console.log("[Header] Miniapp user info:", {
        isMiniApp,
        hasProviderUser: !!providerUser,
        username,
        pfpUrl,
        displayName: providerUser?.displayName,
        userObject: providerUser
      });
    }
  }, [isMiniApp, providerUser, username, pfpUrl]);

  return (
    <header className="
      relative flex flex-col gap-4
      bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm
    ">
      {/* Top row: Logo + Title/Tagline + Buy Button */}
      <div className="flex items-start justify-between gap-4 w-full">
        <HeaderLogo />
        {/* Buy Button - positioned top right, aligned with title */}
        <div className="flex items-center flex-shrink-0">
          <HeaderBuyButton 
            isMiniApp={isMiniApp}
            isConnected={isConnected}
            address={address}
            onConnect={onConnect}
          />
        </div>
      </div>
      
      {/* Wallet below */}
      <div className="w-full">
        <HeaderWallet
          isConnected={isConnected}
          formattedBalance={formattedBalance}
          symbol={symbol}
          pfpUrl={pfpUrl}
          username={username}
          address={address}
          isMiniApp={isMiniApp}
          providerUser={providerUser}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
}
