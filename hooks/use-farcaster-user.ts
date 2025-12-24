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
        
        // Add timeout and better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            // Handle different error statuses
            if (response.status === 404) {
              // User not found is not an error - just no Farcaster account linked
              console.log('[useFarcasterUser] ℹ️ No Farcaster user found for wallet (404)');
              setWalletFarcasterUser(null);
              setWalletUserError(null);
              return;
            }
            
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText || `HTTP ${response.status}` };
            }
            
            throw new Error(errorData.message || errorData.error || `API returned status ${response.status}`);
          }

          const data = await response.json();
          
          // Check for error in response data
          if (data.error) {
            console.log('[useFarcasterUser] ℹ️ API returned error:', data.error);
            setWalletFarcasterUser(null);
            setWalletUserError(null); // Don't treat "not found" as error
            return;
          }
          
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
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          // Handle abort (timeout)
          if (fetchError.name === 'AbortError') {
            console.warn('[useFarcasterUser] ⏱️ Request timeout');
            throw new Error('Request timeout - please try again');
          }
          
          throw fetchError;
        }
      } catch (error: any) {
        // Only log and set error for actual failures, not "not found" cases
        if (error?.message?.includes('not found') || error?.message?.includes('404')) {
          console.log('[useFarcasterUser] ℹ️ No Farcaster user found:', error.message);
          setWalletFarcasterUser(null);
          setWalletUserError(null);
        } else {
          console.error('[useFarcasterUser] ❌ Failed to fetch Farcaster user:', {
            error: error?.message || error,
            name: error?.name,
            stack: error?.stack,
          });
          setWalletFarcasterUser(null);
          // Don't set error state for network failures - they're often transient
          // User can retry by reconnecting wallet or refreshing
          setWalletUserError(null);
        }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`/api/farcaster/fid-by-address?address=${address}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            setWalletFarcasterUser(null);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          setWalletFarcasterUser(null);
          return;
        }
        
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw fetchError;
      }
    } catch (error: any) {
      // Don't set error for "not found" or network issues
      if (!error?.message?.includes('not found') && !error?.message?.includes('404')) {
        console.warn('[useFarcasterUser] Refresh failed:', error?.message || error);
      }
      setWalletFarcasterUser(null);
      setWalletUserError(null);
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
