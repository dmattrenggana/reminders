"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatUnits } from "viem";

// Hooks
import { useReminders } from "@/hooks/useReminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { useAutoConnect } from "@/hooks/use-auto-connect";
import { useReminderActions } from "@/hooks/use-reminder-actions";
import { findFarcasterConnector } from "@/lib/utils/farcaster-connector";

// Components
import { Header } from "@/components/dashboard/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TabsHeader } from "@/components/dashboard/TabsHeader";
import { ReminderList } from "@/components/dashboard/ReminderList";
import { FloatingCreate } from "@/components/floating-create";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
  
  const { balance, symbol, refresh: refreshBalance, isLoading: isLoadingBalance } = useTokenBalance();

  // Auto-connect for miniapp
  useAutoConnect({
    isMiniApp,
    hasUser: !!providerUser,
    isConnected,
    isLoaded: isFarcasterLoaded,
    mounted
  });

  // Reminder actions hook
  const {
    createReminder,
    confirmReminder,
    helpRemind,
    isSubmitting,
    txStatus,
    setTxStatus,
  } = useReminderActions({
    address,
    isConnected,
    providerUser,
    refreshReminders,
    refreshBalance,
  });

  const { toast } = useToast();

  // State untuk Farcaster user dari wallet address
  const [walletFarcasterUser, setWalletFarcasterUser] = useState<any>(null);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        await sdk.actions.ready();
        console.log("Farcaster MiniApp SDK initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Farcaster MiniApp:", error);
        
      }
    };

    if (typeof window !== 'undefined') {
      initializeMiniApp();
    }
  }, []);

  // Fetch Farcaster user ketika wallet connected
  useEffect(() => {
    const fetchWalletFarcasterUser = async () => {
      // Skip if already have providerUser (miniapp) or no address
      if (providerUser?.fid || !address || !isConnected) {
        return;
      }

      try {
        console.log('[Dashboard] Fetching Farcaster user for wallet:', address);
        const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`);
        const data = await response.json();
        
        if (data.fid && data.user) {
          console.log('[Dashboard] Farcaster user fetched:', {
            fid: data.fid,
            username: data.user.username
          });
          setWalletFarcasterUser(data.user);
        } else {
          console.log('[Dashboard] No Farcaster user found for wallet');
          setWalletFarcasterUser(null);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch Farcaster user:', error);
        setWalletFarcasterUser(null);
      }
    };

    fetchWalletFarcasterUser();
  }, [address, isConnected, providerUser?.fid]);

  // Computed values - prioritize Farcaster user info from provider (miniapp) or wallet lookup
  // Priority: providerUser (miniapp) > walletFarcasterUser (wallet lookup) > null
  const farcasterUser = providerUser || walletFarcasterUser;
  const username = farcasterUser?.username || farcasterUser?.displayName;
  const pfpUrl = farcasterUser?.pfpUrl || farcasterUser?.pfp;

  // Debug logging for user info (moved from HeaderWallet)
  useEffect(() => {
    if (isMiniApp && providerUser) {
      console.log("[DashboardClient] User info computed:", {
        isMiniApp,
        hasProviderUser: !!providerUser,
        username,
        pfpUrl,
        displayName: providerUser?.displayName,
        providerUserKeys: providerUser ? Object.keys(providerUser) : [],
        fullUser: providerUser
      });
    }
  }, [isMiniApp, providerUser, username, pfpUrl]);
  
  // Format balance with proper handling (memoized to prevent re-renders)
  const formattedBalance = useMemo(() => {
    // Show loading state if balance is being fetched
    if (isLoadingBalance && isConnected && address) {
      return "...";
    }
    
    if (!isConnected || !address) {
      return "0.00";
    }
    
    // If balance is undefined or null, show 0.00
    if (balance === undefined || balance === null) {
      console.warn("[Dashboard] Balance is undefined/null:", { balance, isConnected, address });
      return "0.00";
    }
    
    // Handle both bigint and string types
    let balanceValue: bigint;
    if (typeof balance === 'bigint') {
      balanceValue = balance;
    } else if (typeof balance === 'string') {
      try {
        balanceValue = BigInt(balance);
      } catch {
        console.warn("[Dashboard] Invalid balance string:", balance);
        return "0.00";
      }
    } else {
      console.warn("[Dashboard] Unexpected balance type:", typeof balance, balance);
      return "0.00";
    }
    
    try {
      // Convert from wei (18 decimals) to token units
      const num = Number(formatUnits(balanceValue, 18));
      
      console.log("[Dashboard] Formatted balance:", {
        raw: balanceValue.toString(),
        formatted: num,
        address
      });
      
      // Format with proper decimal places
      if (num === 0) {
        return "0.00";
      }
      if (num < 0.01) {
        return num.toFixed(6); // Show more decimals for very small amounts
      }
      if (num < 1) {
        return num.toFixed(4); // Show 4 decimals for amounts < 1
      }
      if (num < 1000) {
        return num.toFixed(2); // Show 2 decimals for amounts < 1000
      }
      // For large amounts, use compact notation
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M";
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K";
      }
      return num.toFixed(2);
    } catch (error) {
      console.error("[Dashboard] Error formatting balance:", error, { balance, balanceValue });
      return "0.00";
    }
  }, [balance, isConnected, address, isLoadingBalance]);

  // Stats calculation
  const stats = useMemo(() => {
    const safeReminders = Array.isArray(reminders) ? reminders : [];
    
    // Public Feed: semua reminder yang belum resolved dari semua user (termasuk milik kita)
    const publicFeed = safeReminders.filter(r => !r.isResolved);
    
    // My Feed: semua reminder yang dibuat oleh user yang sedang terkoneksi (resolved atau belum)
    const myFeed = safeReminders.filter(
      r => address && r.creator?.toLowerCase() === address.toLowerCase()
    );
    
    // Stats: HANYA untuk user yang sedang terkoneksi
    // Locked: Total token yang di-lock oleh user di reminder yang belum resolved
    const myActiveReminders = myFeed.filter(r => !r.isResolved);
    const locked = myActiveReminders.reduce((acc, curr) => acc + Number(curr.rewardPool || 0), 0);
    
    // Completed: Jumlah reminder user yang sudah di-confirm
    const completed = myFeed.filter(r => r.isResolved && r.isCompleted).length;
    
    // Burned: Jumlah reminder user yang burned (missed)
    const burned = myFeed.filter(r => r.isResolved && !r.isCompleted).length;
    
    // Total Tasks: Total reminder yang dibuat oleh user (all statuses)
    const totalTasks = myFeed.length;
    
    return {
      locked,
      completed,
      burned,
      totalTasks,
      publicFeed,
      myFeed
    };
  }, [reminders, address]);


  // Connect handler
  const handleConnect = () => {
    const fcConnector = findFarcasterConnector(connectors);
    
    if (fcConnector) {
      connect({ connector: fcConnector });
    } else {
      // Fallback untuk web browser (Injected/MetaMask)
      const injectedConnector = connectors.find((c) => c.id === "injected");
      connect({ connector: injectedConnector || connectors[0] });
    }
  };

  // Help remind handler - Use FID from providerUser or walletFarcasterUser
  const handleHelpRemindMe = async (reminder: any) => {
    // Try to get FID from farcasterUser (providerUser or walletFarcasterUser)
    const fid = farcasterUser?.fid;
    if (fid) {
      helpRemind(reminder, isMiniApp, fid);
      return;
    }

    // If still no FID, try to fetch from wallet address (fallback)
    if (address) {
      try {
        setTxStatus("Fetching Farcaster user...");
        const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`);
        const data = await response.json();
        
        if (data.fid) {
          setTxStatus("");
          // Update walletFarcasterUser state
          setWalletFarcasterUser(data.user);
          helpRemind(reminder, isMiniApp, data.fid);
        } else {
          setTxStatus("");
          toast({
            variant: "destructive",
            title: "Farcaster User Not Found",
            description: "Please connect your Farcaster account to your wallet address to help remind others.",
          });
        }
      } catch (error: any) {
        console.error("Failed to fetch FID:", error);
        setTxStatus("");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch Farcaster user. Please try again.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
      });
    }
  };

  // Refresh handler with debouncing to save quota
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown between manual refreshes
  
  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN) {
      toast({
        variant: "default",
        title: "Please wait",
        description: `Wait ${Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshRef.current)) / 1000)}s before refreshing again`,
      });
      return;
    }
    lastRefreshRef.current = now;
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
          symbol={symbol || "RMNDtest"}
          pfpUrl={pfpUrl}
          username={username}
          address={address}
          isMiniApp={isMiniApp}
          providerUser={farcasterUser}
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
              feedType="public"
              address={address}
              onHelpRemind={handleHelpRemindMe}
              onConfirm={confirmReminder}
            />
          </TabsContent>

          <TabsContent value="my">
            <ReminderList 
              items={stats.myFeed}
              feedType="my"
              address={address}
              onConfirm={confirmReminder}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Create Button */}
      <FloatingCreate 
        symbol={symbol} 
        isSubmitting={isSubmitting} 
        onConfirm={createReminder}
        status={txStatus}
      />
    </div>
  );
}
