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
      flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 
      bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm
    ">
      {/* LEFT: Logo + Title + Tagline, then Wallet below */}
      <div className="flex flex-col gap-3 w-full md:w-auto">
        <HeaderLogo />
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
      
      {/* RIGHT: Buy Button (top right) */}
      <div className="flex items-start md:items-center w-full md:w-auto justify-end">
        <HeaderBuyButton isMiniApp={isMiniApp} />
      </div>
    </header>
  );
}
