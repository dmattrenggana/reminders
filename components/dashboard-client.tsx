"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import Image from "next/image";
import { CONTRACTS, REMINDER_VAULT_ABI, COMMIT_TOKEN_ABI } from "@/lib/contracts/config";

// Hooks
import { useReminders } from "@/hooks/useReminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { useAutoConnect } from "@/hooks/use-auto-connect";
// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingCreate } from "@/components/floating-create";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReminderCard } from "@/components/reminders/reminder-card";

// Icons
import { Bell, Loader2, Wallet, RefreshCw, LogOut } from "lucide-react";

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);

  // Farcaster context
  const { 
    user: providerUser, 
    isLoaded: isFarcasterLoaded, 
    isMiniApp 
  } = useFarcaster();

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Data hooks
  const { 
    activeReminders: reminders = [], 
    loading: loadingReminders, 
    refresh: refreshReminders 
  } = useReminders();
  
  const { balance, symbol, refresh: refreshBalance } = useTokenBalance();

  // Auto-connect for miniapp
  useAutoConnect({
    isMiniApp,
    hasUser: !!providerUser,
    isConnected,
    isLoaded: isFarcasterLoaded,
    mounted
  });

  // Wagmi hooks for contract interactions
  const { writeContract } = useWriteContract();

  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create reminder function (V4)
  const createReminder = async (desc: string, amt: string, dl: string) => {
    if (!isConnected || !address) {
      alert("Please connect wallet first");
      return;
    }

    if (!desc || !amt || !dl) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const farcasterUsername = providerUser?.username || `wallet-${address.slice(0, 6)}`;
      const amountInWei = parseUnits(amt, 18);
      const deadlineTimestamp = Math.floor(new Date(dl).getTime() / 1000);

      // Check if current time is valid
      if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
        alert("Deadline must be in the future");
        setIsSubmitting(false);
        return;
      }

      // Step 1: Check and approve token if needed
      // Note: Approval check will be done via separate hook or API call
      // For now, we'll try to approve first, then create
      try {
        await writeContract({
          address: CONTRACTS.COMMIT_TOKEN as `0x${string}`,
          abi: COMMIT_TOKEN_ABI,
          functionName: 'approve',
          args: [CONTRACTS.REMINDER_VAULT, amountInWei],
        });
        // Wait a bit for approval to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (approveError: any) {
        // If approval fails, might already be approved, continue anyway
        console.log("Approval check:", approveError.message);
      }

      // Step 2: Create reminder
      await writeContract({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'createReminder',
        args: [amountInWei, BigInt(deadlineTimestamp), desc, farcasterUsername],
      });

      alert("✅ Reminder created! Transaction submitted.");
      refreshReminders();
      refreshBalance();
    } catch (error: any) {
      console.error("Create reminder error:", error);
      alert(error.shortMessage || error.message || "Failed to create reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm reminder function (V4)
  const confirmReminder = async (id: number) => {
    if (!isConnected || !address) {
      alert("Please connect wallet first");
      return;
    }

    setIsSubmitting(true);
    try {
      await writeContract({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'confirmReminder',
        args: [BigInt(id)],
      });

      alert("✅ Reminder confirmed! Tokens returned.");
      refreshReminders();
      refreshBalance();
    } catch (error: any) {
      console.error("Confirm reminder error:", error);
      alert(error.shortMessage || error.message || "Failed to confirm reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Help remind function (V4)
  const helpRemind = async (reminder: any, isMiniApp: boolean, fid: number) => {
    if (!isConnected || !address) {
      alert("Please connect wallet first");
      return;
    }

    // First, call API to record reminder and get Neynar score
    try {
      const response = await fetch("/api/reminders/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderId: reminder.id,
          helperAddress: address,
          helperFid: fid,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        alert(data.error || "Failed to record reminder");
        return;
      }

      // Then claim reward
      setIsSubmitting(true);
      try {
        await writeContract({
          address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
          abi: REMINDER_VAULT_ABI,
          functionName: 'claimReward',
          args: [BigInt(reminder.id)],
        });

        alert(`✅ Reward claimed! You earned ${data.data?.estimatedReward || "tokens"}`);
        refreshReminders();
        refreshBalance();
      } catch (error: any) {
        console.error("Claim reward error:", error);
        alert(error.shortMessage || error.message || "Failed to claim reward");
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Help remind error:", error);
      alert(error.message || "Failed to help remind");
    }
  };

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Computed values
  const username = providerUser?.username;
  const pfpUrl = providerUser?.pfpUrl || providerUser?.pfp;
  const formattedBalance = typeof balance === 'bigint' 
    ? Number(formatUnits(balance, 18)).toFixed(2) 
    : "0.00";

  // Stats calculation
  const stats = useMemo(() => {
    const safeReminders = Array.isArray(reminders) ? reminders : [];
    return {
      locked: safeReminders
        .filter(r => !r.isResolved)
        .reduce((acc, curr) => acc + Number(curr.rewardPool || 0), 0),
      completed: safeReminders.filter(r => r.isResolved && r.isCompleted).length,
      burned: safeReminders.filter(r => r.isResolved && !r.isCompleted).length,
      publicFeed: safeReminders.filter(r => !r.isResolved),
      myFeed: safeReminders.filter(
        r => r.creator?.toLowerCase() === address?.toLowerCase()
      )
    };
  }, [reminders, address]);

  // Connect handler
  const handleConnect = () => {
    const fcConnector = connectors.find(
      (c) => c.id === "farcasterMiniApp" || c.id === "io.farcaster.miniapp"
    );
    
    if (fcConnector) {
      connect({ connector: fcConnector });
    } else {
      const injectedConnector = connectors.find((c) => c.id === "injected");
      connect({ connector: injectedConnector || connectors[0] });
    }
  };

  // Help remind handler
  const handleHelpRemindMe = (reminder: any) => {
    helpRemind(reminder, isMiniApp, providerUser?.fid || 0);
  };

  // Refresh handler
  const handleRefresh = () => {
    refreshReminders();
    refreshBalance();
  };

  // Loading state
  if (!mounted || !isFarcasterLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-10 pb-32">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <Header
          isConnected={isConnected}
          formattedBalance={formattedBalance}
          symbol={symbol}
          pfpUrl={pfpUrl}
          username={username}
          address={address}
          isMiniApp={isMiniApp}
          providerUser={providerUser}
          onConnect={handleConnect}
          onDisconnect={disconnect}
        />

        {/* Stats Cards */}
        <StatsCards stats={stats} symbol={symbol} reminders={reminders} />

        {/* Tabs */}
        <Tabs defaultValue="public" className="w-full">
          <TabsHeader 
            loadingReminders={loadingReminders}
            onRefresh={handleRefresh}
          />

          <TabsContent value="public">
            <ReminderList 
              items={stats.publicFeed} 
              onHelp={handleHelpRemindMe}
              onConfirm={confirmReminder} 
              address={address} 
            />
          </TabsContent>

          <TabsContent value="my">
            <ReminderList 
              items={stats.myFeed} 
              onHelp={handleHelpRemindMe}
              onConfirm={confirmReminder} 
              address={address} 
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Create Button */}
      <FloatingCreate 
        symbol={symbol} 
        isSubmitting={isSubmitting} 
        onConfirm={createReminder} 
      />
    </div>
  );
}

// ============= Sub-components =============

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

function Header({
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
  return (
    <header className="
      flex flex-col md:flex-row items-center justify-between gap-6 
      bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm
    ">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
          <Image 
            src="/logo.jpg" 
            alt="Logo" 
            fill 
            className="object-cover" 
            priority 
          />
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
              px-4 text-[11px] font-black text-[#4f46e5] 
              border-r border-slate-200
            ">
              {formattedBalance} {symbol}
            </div>
            <Button 
              variant="ghost" 
              onClick={onDisconnect} 
              className="
                flex items-center gap-2 h-9 px-3 rounded-full 
                bg-white transition-all shadow-sm
              "
            >
              {pfpUrl ? (
                <img 
                  src={pfpUrl} 
                  alt="PFP" 
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-50" 
                  referrerPolicy="no-referrer" 
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
            {isMiniApp && providerUser ? (
              <div className="flex items-center gap-2">
                {pfpUrl && (
                  <img 
                    src={pfpUrl} 
                    alt="PFP" 
                    className="w-6 h-6 rounded-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                )}
                <span>@{username}</span>
              </div>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        )}
      </div>
    </header>
  );
}

interface StatsCardsProps {
  stats: {
    locked: number;
    completed: number;
    burned: number;
  };
  symbol: string;
  reminders: any[];
}

function StatsCards({ stats, symbol, reminders }: StatsCardsProps) {
  const cards = [
    { 
      label: `Locked ${symbol}`, 
      val: stats.locked, 
      color: "border-b-indigo-500" 
    },
    { 
      label: "Completed", 
      val: stats.completed, 
      color: "border-b-green-500" 
    },
    { 
      label: "Burned", 
      val: stats.burned, 
      color: "border-b-red-500" 
    },
    { 
      label: "Total Tasks", 
      val: Array.isArray(reminders) ? reminders.length : 0, 
      color: "bg-[#4f46e5] text-white border-none shadow-indigo-100 shadow-xl" 
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card 
          key={i} 
          className={`
            rounded-3xl shadow-sm border-slate-100 overflow-hidden ${card.color}
          `}
        >
          <CardHeader className="pb-1">
            <CardTitle className="
              text-[10px] font-black uppercase opacity-60 tracking-wider
            ">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{card.val}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TabsHeaderProps {
  loadingReminders: boolean;
  onRefresh: () => void;
}

function TabsHeader({ loadingReminders, onRefresh }: TabsHeaderProps) {
  return (
    <div className="
      flex items-center justify-between mb-6 bg-white/60 backdrop-blur-sm 
      p-2 rounded-3xl border border-slate-200 shadow-sm
    ">
      <TabsList className="bg-transparent border-none gap-2">
        <TabsTrigger 
          value="public" 
          className="
            rounded-2xl px-6 font-black text-xs uppercase transition-all 
            data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white
          "
        >
          🌍 Public Feed
        </TabsTrigger>
        <TabsTrigger 
          value="my" 
          className="
            rounded-2xl px-6 font-black text-xs uppercase transition-all 
            data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white
          "
        >
          👤 My Feed
        </TabsTrigger>
      </TabsList>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRefresh}
        className="text-[#4f46e5] font-black text-[10px] uppercase"
      >
        <RefreshCw 
          className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} 
        /> 
        Sync Network
      </Button>
    </div>
  );
}

interface ReminderListProps {
  items: any[];
  onHelp: (reminder: any) => void;
  onConfirm: (id: number) => void;
  address?: string;
}

function ReminderList({ items, onHelp, onConfirm, address }: ReminderListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="
        text-center py-24 bg-white rounded-[3rem] 
        border-2 border-dashed border-slate-100
      ">
        <Bell size={40} className="text-slate-100 mx-auto mb-4" />
        <p className="
          text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]
        ">
          No activity found
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-5">
      {items.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          address={address}
          onHelp={onHelp}
          onConfirm={onConfirm}
        />
      ))}
    </div>
  );
}
