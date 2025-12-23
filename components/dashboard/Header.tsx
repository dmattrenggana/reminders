"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

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
  const [pfpError, setPfpError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Handle image loading errors
  const handlePfpError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.preventDefault();
    e.stopPropagation();
    setPfpError(true);
    return false;
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <header className="
      flex flex-col md:flex-row items-center justify-between gap-6 
      bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm
    ">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm bg-slate-100">
          {!logoError ? (
            <Image 
              src="/logo.jpg" 
              alt="Logo" 
              fill 
              className="object-cover" 
              priority
              onError={handleLogoError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-100">
              <span className="text-indigo-600 font-bold text-lg">R</span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter">Reminders</h1>
          <p className="
            text-[10px] font-bold text-slate-400 uppercase 
            tracking-widest leading-none
          ">
            Never Miss What Matters
          </p>
        </div>
      </div>
      
      {/* Wallet section */}
      <div className="flex items-center gap-3">
        {isConnected ? (
          <div className="
            flex items-center gap-2 bg-slate-50 p-1 rounded-full 
            border border-slate-200 shadow-sm
          ">
            <div className="
              px-4 py-1.5 text-xs font-bold text-[#4f46e5] 
              border-r border-slate-200 whitespace-nowrap
            ">
              {formattedBalance || "0.00"} <span className="text-[10px] opacity-75">{symbol || "RMNDtest"}</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={onDisconnect} 
              className="
                flex items-center gap-2 h-9 px-3 rounded-full 
                bg-white transition-all shadow-sm
              "
            >
              {pfpUrl && !pfpError ? (
                <img 
                  src={pfpUrl} 
                  alt="PFP" 
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-50" 
                  referrerPolicy="no-referrer"
                  onError={handlePfpError}
                />
              ) : (
                <Wallet className="h-4 w-4 text-indigo-500" />
              )}
              <span className="text-xs font-black">
                {username ? `@${username}` : `${address?.slice(0, 4)}...`}
              </span>
              <LogOut className="h-3 w-3 opacity-20 ml-1" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onConnect} 
            className="
              rounded-full bg-[#4f46e5] hover:opacity-90 font-bold 
              text-white h-12 px-8 shadow-lg transition-all active:scale-95
            "
          >
            {/* Show user info if logged in via Farcaster miniapp */}
            {isMiniApp && providerUser && (username || pfpUrl) ? (
              <div className="flex items-center gap-2">
                {pfpUrl && !pfpError ? (
                  <img 
                    src={pfpUrl} 
                    alt={username || "User"} 
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30" 
                    referrerPolicy="no-referrer"
                    onError={handlePfpError}
                  />
                ) : username ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-300 flex items-center justify-center text-xs font-bold text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                <span>
                  {username ? `Connect @${username}` : "Connect Wallet"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </div>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
