"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatUnits } from "viem";

// Hooks
import { useReminders } from "@/hooks/useReminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { useFarcasterUser } from "@/hooks/use-farcaster-user";
import { useAutoConnect } from "@/hooks/use-auto-connect";
import { useReminderActions } from "@/hooks/use-reminder-actions";
import { findFarcasterConnector } from "@/lib/utils/farcaster-connector";

// Components
import { Header } from "@/components/dashboard/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TabsHeader } from "@/components/dashboard/TabsHeader";
import { ReminderList } from "@/components/dashboard/ReminderList";
import { FloatingCreate } from "@/components/floating-create";
import { ClaimRewardPopup } from "@/components/claim-reward-popup";
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

  // Farcaster user hook - provides comprehensive user data for workflows
  const {
    user: farcasterUser,
    hasFid,
    displayName: farcasterDisplayName,
    username: farcasterUsername,
    fid: farcasterFid,
    pfpUrl: farcasterPfpUrl,
    isLoading: isLoadingFarcasterUser,
    refreshWalletUser,
  } = useFarcasterUser();

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
    shareReminder,
    confirmReminder,
    helpRemind,
    claimReward,
    isSubmitting,
    txStatus,
    setTxStatus,
    showClaimPopup,
    setShowClaimPopup,
    claimPopupData,
    setClaimPopupData,
  } = useReminderActions({
    address,
    isConnected,
    providerUser,
    refreshReminders,
    refreshBalance,
  });

  const { toast } = useToast();

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

  // Use farcasterUser from hook (already includes all logic for provider/wallet priority)
  // Fallback values for compatibility with existing code
  const username = farcasterUsername || farcasterDisplayName;
  const pfpUrl = farcasterPfpUrl;

  // Debug logging for user info
  useEffect(() => {
    if (farcasterUser) {
      console.log("[DashboardClient] ✅ Farcaster user available:", {
        fid: farcasterFid,
        username,
        displayName: farcasterDisplayName,
        hasPfp: !!pfpUrl,
        source: farcasterUser._source,
        environment: farcasterUser._environment,
        hasVerifiedAddress: farcasterUser.verifiedAddresses?.length > 0,
        powerBadge: farcasterUser.power_badge,
      });
    } else if (isConnected && address) {
      console.log("[DashboardClient] ⚠️ Wallet connected but no Farcaster user found:", {
        address,
        isLoading: isLoadingFarcasterUser,
      });
    }
  }, [farcasterUser, farcasterFid, username, farcasterDisplayName, pfpUrl, isConnected, address, isLoadingFarcasterUser]);
  
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

  // Help remind handler - Use FID from farcasterUser hook
  const handleHelpRemindMe = async (reminder: any) => {
    console.log('[Dashboard] handleHelpRemindMe called with reminder:', reminder);
    console.log('[Dashboard] Reminder ID:', reminder.id, 'Type:', typeof reminder.id);
    console.log('[Dashboard] Reminder object keys:', reminder ? Object.keys(reminder) : 'null');
    
    // Validate reminder exists and has required fields
    if (!reminder) {
      console.error('[Dashboard] Reminder is null or undefined');
      toast({
        variant: "destructive",
        title: "Invalid Reminder",
        description: "Reminder data is missing. Please refresh the page.",
      });
      return;
    }
    
    // More flexible validation - allow ID to be 0 or any number, but must exist
    const reminderId = reminder.id !== undefined && reminder.id !== null 
      ? Number(reminder.id) 
      : null;
    
    if (reminderId === null || isNaN(reminderId)) {
      console.error('[Dashboard] Invalid reminder ID:', reminder.id);
      toast({
        variant: "destructive",
        title: "Invalid Reminder",
        description: `Reminder ID is invalid: ${reminder.id}. Please refresh the page.`,
      });
      return;
    }
    
    // Validate reminder has creator address (required for fetching username)
    if (!reminder.creator) {
      console.error('[Dashboard] Reminder missing creator address:', reminder);
      toast({
        variant: "destructive",
        title: "Invalid Reminder",
        description: "Reminder creator information is missing. Please refresh the page.",
      });
      return;
    }
    
    // Try to get FID from farcasterUser hook
    if (farcasterFid) {
      console.log('[Dashboard] Using FID from hook:', farcasterFid);
      helpRemind(reminder, isMiniApp, farcasterFid).catch((error: any) => {
        console.error('[Dashboard] helpRemind error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to help remind. Please try again.",
        });
      });
      return;
    }

    // If still no FID, try fetching directly from wallet address (fallback)
    if (address && isConnected) {
      try {
        setTxStatus("Fetching Farcaster user...");
        console.log('[Dashboard] Fetching FID for address:', address);
        
        const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[Dashboard] FID fetch response:', data);
        
        if (data.fid) {
          setTxStatus("");
          // Trigger refresh in hook for future use, but use the fetched FID immediately
          refreshWalletUser().catch(console.error);
          helpRemind(reminder, isMiniApp, data.fid).catch((error: any) => {
            console.error('[Dashboard] helpRemind error:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message || "Failed to help remind. Please try again.",
            });
          });
        } else {
          setTxStatus("");
          toast({
            variant: "destructive",
            title: "Farcaster User Not Found",
            description: "Please connect your Farcaster account to your wallet address to help remind others.",
          });
        }
      } catch (error: any) {
        console.error("[Dashboard] Failed to fetch FID:", error);
        setTxStatus("");
        
        // Check if it's a CSP error
        if (error.message?.includes('Content Security Policy') || error.message?.includes('CSP') || error.message?.includes('violates')) {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Unable to connect. Please check your browser settings and try again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to fetch Farcaster user. Please try again.",
          });
        }
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
  const REFRESH_COOLDOWN = 5000; // 5 seconds cooldown between manual refreshes (reduced for better UX)
  
  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN) {
      toast({
        variant: "default",
        title: "Please wait",
        description: `Wait ${Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshRef.current)) / 1000)}s before refreshing again`,
        duration: 2000,
      });
      return;
    }
    lastRefreshRef.current = now;
    // Force refresh (bypasses cache and throttle)
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
          symbol={symbol || "RMND"}
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
        onShare={shareReminder}
      />
      
      {/* Claim Reward Popup */}
      {showClaimPopup && claimPopupData && (
        <ClaimRewardPopup
          isOpen={showClaimPopup}
          onClose={() => {
            setShowClaimPopup(false);
            setClaimPopupData(null);
            setTxStatus("");
          }}
          onClaim={async () => {
            const neynarScore = Math.floor((claimPopupData.neynarScore || 0.5) * 100);
            await claimReward(claimPopupData.reminderId, neynarScore);
          }}
          estimatedReward={claimPopupData.estimatedReward}
          neynarScore={claimPopupData.neynarScore}
          isClaiming={isSubmitting && txStatus.includes("Claiming")}
        />
      )}
    </div>
  );
}
