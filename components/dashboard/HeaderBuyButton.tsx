"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CONTRACTS } from "@/lib/contracts/config";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { createImageErrorHandler } from "@/lib/utils/image-error-handler";

interface HeaderBuyButtonProps {
  isMiniApp: boolean;
}

export function HeaderBuyButton({ isMiniApp }: HeaderBuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { toast } = useToast();
  const handleLogoError = createImageErrorHandler(setLogoError, { suppressConsole: true });

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
      // Base chain ID: 8453
      // Format CAIP-19: eip155:8453/erc20:0x...
      const buyToken = `eip155:8453/erc20:${CONTRACTS.COMMIT_TOKEN}`;
      
      // Optional: Set sellToken as native ETH (user can change in swap UI)
      const sellToken = `eip155:8453/native`; // Base ETH

      console.log("[HeaderBuyButton] Opening swap interface:", {
        buyToken,
        sellToken,
        isMiniApp,
      });

      // Always try to use Farcaster SDK swapToken (works in both miniapp and web if SDK is available)
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        
        if (sdk?.actions?.swapToken) {
          // Use Farcaster SDK swapToken
          const result = await sdk.actions.swapToken({
            buyToken, // RMND token on Base
            sellToken, // Native ETH (optional - user can change)
            // sellAmount is optional - user can set amount in swap UI
          });

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
          } else {
            if (result.reason === "rejected_by_user") {
              console.log("[HeaderBuyButton] Swap cancelled by user");
              setIsLoading(false);
              return; // Exit early on user cancellation
            } else {
              throw new Error(result.error?.message || "Swap failed");
            }
          }
        } else {
          throw new Error("swapToken action not available in SDK");
        }
      } catch (sdkError: any) {
        // If SDK not available or swapToken not supported, show helpful message
        console.warn("[HeaderBuyButton] SDK swapToken not available:", sdkError);
        toast({
          variant: "default",
          title: "Swap Not Available",
          description: "Please use Farcaster wallet to swap tokens. The swap feature is only available in Farcaster miniapp.",
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
    <Button
      onClick={handleBuyClick}
      disabled={isLoading}
      className="
        flex items-center gap-1.5 h-8 px-3 rounded-lg
        bg-[#4f46e5] hover:bg-[#4338ca] text-white
        font-bold text-xs shadow-sm transition-all active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
        </>
      ) : (
        <>
          <div className="relative w-4 h-4 rounded overflow-hidden flex-shrink-0">
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
                <span className="text-indigo-700 font-bold text-[10px]">R</span>
              </div>
            )}
          </div>
          <span>Buy</span>
        </>
      )}
    </Button>
  );
}

