"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CONTRACTS } from "@/lib/contracts/config";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { createImageErrorHandler } from "@/lib/utils/image-error-handler";
import { useAccount, useConnect } from "wagmi";
import { findFarcasterConnector, detectEnvironment } from "@/lib/utils/farcaster-connector";

interface HeaderBuyButtonProps {
  isMiniApp: boolean;
  isConnected?: boolean;
  address?: string;
  onConnect?: () => void;
}

export function HeaderBuyButton({ 
  isMiniApp: propIsMiniApp, 
  isConnected: propIsConnected, 
  address: propAddress,
  onConnect: propOnConnect 
}: HeaderBuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { toast } = useToast();
  const handleLogoError = createImageErrorHandler(setLogoError, { suppressConsole: true });
  
  // Get wallet connection state (use props if provided, otherwise use hooks)
  const { address: hookAddress, isConnected: hookIsConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  
  const isConnected = propIsConnected ?? hookIsConnected;
  const address = propAddress ?? hookAddress;
  
  // ✅ FIX: Detect miniapp directly as fallback (for browser miniapp detection)
  const detectedEnvironment = detectEnvironment();
  const detectedIsMiniApp = detectedEnvironment === 'farcaster-miniapp' || detectedEnvironment === 'base-app';
  
  // Use detected value if prop is false but we detect miniapp (fallback for browser miniapp)
  const isMiniApp = propIsMiniApp || detectedIsMiniApp;
  
  // Debug logging for environment detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("[HeaderBuyButton] Environment detection:", {
        propIsMiniApp,
        detectedEnvironment,
        detectedIsMiniApp,
        finalIsMiniApp: isMiniApp,
        hasFarcaster: 'Farcaster' in window,
        hasFarcasterWindow: !!(window as any).Farcaster,
        userAgent: navigator.userAgent,
      });
    }
  }, [propIsMiniApp, detectedEnvironment, detectedIsMiniApp, isMiniApp]);

  const handleBuyClick = async () => {
    if (!CONTRACTS.COMMIT_TOKEN) {
      toast({
        variant: "destructive",
        title: "Token Address Not Configured",
        description: "Token contract address is not set. Please contact support.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // ✅ STEP 1: Check wallet connection first (like eth_accounts)
      console.log("[HeaderBuyButton] Checking wallet connection:", {
        isConnected,
        address,
        isMiniApp,
      });

      // If not connected, try to connect wallet first (especially in miniapp)
      if (!isConnected) {
        console.log("[HeaderBuyButton] Wallet not connected, attempting to connect...");
        
        // In miniapp, try to connect using Farcaster connector
        if (isMiniApp) {
          const fcConnector = findFarcasterConnector(connectors);
          
          if (fcConnector) {
            try {
              console.log("[HeaderBuyButton] Connecting wallet via Farcaster connector...");
              connect({ connector: fcConnector });
              
              // Wait a bit for connection to establish
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Use prop onConnect if available, otherwise show message
              if (propOnConnect) {
                propOnConnect();
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              console.log("[HeaderBuyButton] Wallet connection initiated, proceeding with swap...");
              // Continue to swap - connection will be established by the time swap is called
            } catch (connectError: any) {
              console.error("[HeaderBuyButton] Wallet connection error:", connectError);
              toast({
                variant: "destructive",
                title: "Wallet Connection Required",
                description: "Please connect your wallet first to use the swap feature.",
                duration: 4000,
              });
              setIsLoading(false);
              return;
            }
          } else {
            // If no Farcaster connector, use prop onConnect if available
            if (propOnConnect) {
              propOnConnect();
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log("[HeaderBuyButton] Wallet connection initiated via prop...");
            } else {
              toast({
                variant: "destructive",
                title: "Wallet Connection Required",
                description: "Please connect your wallet first to use the swap feature.",
                duration: 4000,
              });
              setIsLoading(false);
              return;
            }
          }
        } else {
          // In browser, show message to connect wallet
          toast({
            variant: "default",
            title: "Wallet Connection Required",
            description: "Please connect your wallet first to use the swap feature.",
            duration: 4000,
          });
          setIsLoading(false);
          return;
        }
      }

      // ✅ STEP 2: Proceed with swap (wallet is now connected)
      console.log("[HeaderBuyButton] ✅ Wallet connected, proceeding with swap");

      // Base chain ID: 8453
      // Format CAIP-19: eip155:8453/erc20:0x...
      const buyToken = `eip155:8453/erc20:${CONTRACTS.COMMIT_TOKEN}`;
      
      // Optional: Set sellToken as native ETH (user can change in swap UI)
      const sellToken = `eip155:8453/native`; // Base ETH

      console.log("[HeaderBuyButton] Opening swap interface:", {
        buyToken,
        sellToken,
        isMiniApp,
        address,
        isConnected,
        userAgent: navigator.userAgent,
      });

      // Try to use Farcaster SDK with proper error handling
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        
        console.log("[HeaderBuyButton] SDK loaded:", {
          hasSDK: !!sdk,
          hasActions: !!sdk?.actions,
          hasSwapToken: !!sdk?.actions?.swapToken,
          hasOpenUrl: !!sdk?.actions?.openUrl,
          isMiniApp,
          userAgent: navigator.userAgent.includes('Warpcast') || navigator.userAgent.includes('Farcaster'),
        });

        // ✅ FIX: Only use swapToken - opens wallet in different iframe (overlay) on same page
        // swapToken opens wallet swap in overlay iframe (same page, different iframe)
        // openUrl opens new tab (not desired)
        if (!sdk?.actions?.swapToken) {
          throw new Error("Swap functionality not available. Please open this app in Farcaster mobile app.");
        }

        try {
          console.log("[HeaderBuyButton] Attempting swapToken with:", { buyToken, sellToken });
          
          const result = await sdk.actions.swapToken({
            buyToken, // RMND token on Base
            sellToken, // Native ETH (optional - user can change)
          });

          console.log("[HeaderBuyButton] swapToken result:", result);

          if (result.success) {
            console.log("[HeaderBuyButton] Swap successful:", result.swap);
            toast({
              variant: "default",
              title: "Swap Completed",
              description: "Your tokens have been swapped successfully!",
              duration: 3000,
            });
            setIsLoading(false);
            return;
          } else if (result.reason === "rejected_by_user") {
            console.log("[HeaderBuyButton] Swap cancelled by user");
            setIsLoading(false);
            return;
          } else {
            // swapToken failed for other reasons
            console.error("[HeaderBuyButton] swapToken failed:", result);
            throw new Error(result.reason || "Swap failed. Please try again.");
          }
        } catch (swapError: any) {
          console.error("[HeaderBuyButton] swapToken error:", swapError);
          
          // Don't show error if user rejected
          if (swapError.message?.includes("rejected") || swapError.message?.includes("cancelled")) {
            setIsLoading(false);
            return;
          }
          
          throw new Error(swapError.message || "Failed to open swap interface. Please try again.");
        }

      } catch (sdkError: any) {
        // If SDK not available or all methods failed
        console.error("[HeaderBuyButton] SDK error:", sdkError);
        
        // Show helpful message
        toast({
          variant: "destructive",
          title: "Swap Not Available",
          description: "Please open this app in Farcaster mobile app or use Warpcast wallet directly.",
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error("[HeaderBuyButton] Swap error:", error);
      
      // Don't show error if user rejected
      if (error.message?.includes("rejected") || error.message?.includes("cancelled")) {
        setIsLoading(false);
        return;
      }

      toast({
        variant: "destructive",
        title: "Swap Failed",
        description: error.message || "Failed to open swap interface. Please try again.",
        duration: 3000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="
      inline-flex items-center gap-0 bg-slate-50 p-1 rounded-full 
      border border-slate-200 shadow-sm
    ">
      <Button
        onClick={handleBuyClick}
        disabled={isLoading}
        variant="ghost"
        className="
          flex items-center gap-2 h-9 px-3 rounded-full
          bg-white hover:bg-slate-50
          font-bold text-xs transition-all active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#4f46e5]" />
            <span className="text-xs font-bold text-slate-600">Opening...</span>
          </>
        ) : (
          <>
            <span className="text-xs font-black text-slate-700">Buy</span>
            <div className="relative w-5 h-5 rounded-lg overflow-hidden flex-shrink-0">
              {!logoError ? (
                <Image
                  src="/logo.jpg"
                  alt="RMND"
                  fill
                  className="object-cover"
                  onError={handleLogoError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-200">
                  <span className="text-indigo-700 font-bold text-xs">R</span>
                </div>
              )}
            </div>
          </>
        )}
      </Button>
    </div>
  );
}

