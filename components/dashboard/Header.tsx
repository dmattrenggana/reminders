"use client";

import { useEffect } from "react";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderWallet } from "./HeaderWallet";

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
      flex flex-col md:flex-row items-center justify-between gap-6 
      bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm
    ">
      <HeaderLogo />
      
      <div className="flex items-center gap-3">
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
