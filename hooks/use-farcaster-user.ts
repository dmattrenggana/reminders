"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useFarcaster } from "@/components/providers/farcaster-provider";

/**
 * Custom hook untuk manage Farcaster user data
 * 
 * Hook ini mengumpulkan dan menyediakan data Farcaster user dari berbagai sumber:
 * 1. Provider user (dari miniapp/BaseApp)
 * 2. Wallet lookup (jika wallet connected tapi tidak ada provider user)
 * 
 * Digunakan untuk workflow seperti:
 * - Create reminder (menggunakan username untuk display)
 * - Help remind (menggunakan FID untuk posting)
 * - Display user info di UI
 * - Posting ke Farcaster
 */
export function useFarcasterUser() {
  const { address, isConnected } = useAccount();
  const { user: providerUser, isMiniApp, environment } = useFarcaster();
  
  // State untuk wallet-based Farcaster user
  const [walletFarcasterUser, setWalletFarcasterUser] = useState<any>(null);
  const [isLoadingWalletUser, setIsLoadingWalletUser] = useState(false);
  const [walletUserError, setWalletUserError] = useState<string | null>(null);

  // Fetch Farcaster user dari wallet address jika diperlukan
  useEffect(() => {
    const fetchWalletFarcasterUser = async () => {
      // Skip jika sudah ada providerUser (miniapp/BaseApp)
      if (providerUser?.fid) {
        setWalletFarcasterUser(null);
        setIsLoadingWalletUser(false);
        setWalletUserError(null);
        return;
      }

      // Skip jika tidak ada address atau belum connected
      if (!address || !isConnected) {
        setWalletFarcasterUser(null);
        setIsLoadingWalletUser(false);
        setWalletUserError(null);
        return;
      }

      setIsLoadingWalletUser(true);
      setWalletUserError(null);

      try {
        console.log('[useFarcasterUser] 🔄 Fetching Farcaster user for wallet:', address);
        const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.fid && data.user) {
          console.log('[useFarcasterUser] ✅ Farcaster user fetched:', {
            fid: data.fid,
            username: data.user.username,
          });
          
          setWalletFarcasterUser({
            ...data.user,
            fid: data.fid,
            username: data.user.username,
            displayName: data.user.displayName || data.user.display_name,
            display_name: data.user.display_name || data.user.displayName,
            pfpUrl: data.user.pfpUrl || data.user.pfp_url,
            pfp_url: data.user.pfp_url || data.user.pfpUrl,
            pfp: data.user.pfp_url || data.user.pfpUrl,
          });
          setWalletUserError(null);
        } else {
          console.log('[useFarcasterUser] ℹ️ No Farcaster user found for wallet');
          setWalletFarcasterUser(null);
          setWalletUserError(null);
        }
      } catch (error: any) {
        console.error('[useFarcasterUser] ❌ Failed to fetch Farcaster user:', error);
        setWalletFarcasterUser(null);
        setWalletUserError(error?.message || 'Failed to fetch Farcaster user');
      } finally {
        setIsLoadingWalletUser(false);
      }
    };

    // Debounce to avoid excessive calls
    const timeoutId = setTimeout(() => {
      fetchWalletFarcasterUser();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [address, isConnected, providerUser?.fid]);

  // Computed: Gabungkan user data dengan prioritas providerUser > walletFarcasterUser
  const farcasterUser = useMemo(() => {
    // Prioritas: providerUser (miniapp) > walletFarcasterUser (wallet lookup)
    const user = providerUser || walletFarcasterUser;
    
    if (!user) return null;

    // Return normalized user object dengan semua field yang diperlukan untuk workflow
    return {
      // Identity
      fid: user.fid,
      username: user.username || user.displayName || user.display_name,
      displayName: user.displayName || user.display_name || user.username,
      display_name: user.display_name || user.displayName || user.username,
      
      // Profile
      pfpUrl: user.pfpUrl || user.pfp_url || user.pfp,
      pfp_url: user.pfp_url || user.pfpUrl || user.pfp,
      pfp: user.pfp_url || user.pfpUrl || user.pfp,
      bio: user.bio || user.profile?.bio?.text,
      
      // Verification
      verifications: user.verifications || [],
      verifiedAddresses: user.verifiedAddresses || user.verifications || [],
      verified_addresses: user.verified_addresses,
      verified_accounts: user.verified_accounts,
      
      // Addresses
      custody_address: user.custody_address,
      
      // Social stats
      follower_count: user.follower_count,
      following_count: user.following_count,
      
      // Badge
      power_badge: user.power_badge,
      
      // Profile data
      profile: user.profile,
      
      // Source tracking (untuk debugging)
      _source: providerUser ? 'provider' : 'wallet',
      _environment: environment,
    };
  }, [providerUser, walletFarcasterUser, environment]);

  // Helper: Check if user has FID
  const hasFid = useMemo(() => {
    return !!farcasterUser?.fid;
  }, [farcasterUser]);

  // Helper: Check if user has verified address
  const hasVerifiedAddress = useMemo(() => {
    if (!farcasterUser || !address) return false;
    const verifiedAddresses = farcasterUser.verifications || farcasterUser.verifiedAddresses || [];
    return verifiedAddresses.some((addr: string) => 
      addr.toLowerCase() === address.toLowerCase()
    );
  }, [farcasterUser, address]);

  // Helper: Get user display name (for UI)
  const displayName = useMemo(() => {
    return farcasterUser?.displayName || farcasterUser?.username || 'Anonymous';
  }, [farcasterUser]);

  // Helper: Get user username (for mentions/posting)
  const username = useMemo(() => {
    return farcasterUser?.username || displayName;
  }, [farcasterUser, displayName]);

  // Helper: Refresh wallet user (if applicable)
  const refreshWalletUser = async () => {
    if (providerUser?.fid || !address || !isConnected) {
      return;
    }

    setIsLoadingWalletUser(true);
    setWalletUserError(null);

    try {
      const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`);
      const data = await response.json();
      
      if (data.fid && data.user) {
        setWalletFarcasterUser({
          ...data.user,
          fid: data.fid,
          username: data.user.username,
          displayName: data.user.displayName || data.user.display_name,
          pfpUrl: data.user.pfpUrl || data.user.pfp_url,
        });
      } else {
        setWalletFarcasterUser(null);
      }
    } catch (error: any) {
      setWalletUserError(error?.message || 'Failed to refresh');
    } finally {
      setIsLoadingWalletUser(false);
    }
  };

  return {
    // User data
    user: farcasterUser,
    
    // Helpers
    hasFid,
    hasVerifiedAddress,
    displayName,
    username,
    fid: farcasterUser?.fid,
    pfpUrl: farcasterUser?.pfpUrl,
    
    // Loading states
    isLoading: isLoadingWalletUser,
    isLoadingWalletUser,
    
    // Error state
    error: walletUserError,
    
    // Environment info
    isMiniApp,
    environment,
    source: farcasterUser?._source || null,
    
    // Actions
    refreshWalletUser,
  };
}

