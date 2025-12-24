"use client";

import { useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS, REMINDER_VAULT_ABI, COMMIT_TOKEN_ABI } from "@/lib/contracts/config";
import { useToast } from "@/components/ui/use-toast";

interface UseReminderActionsProps {
  address?: string;
  isConnected: boolean;
  providerUser?: any;
  refreshReminders: () => void;
  refreshBalance: () => void;
}

export function useReminderActions({
  address,
  isConnected,
  providerUser,
  refreshReminders,
  refreshBalance,
}: UseReminderActionsProps) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>("");
  const { toast } = useToast();

  // Create reminder function (V4)
  const createReminder = async (desc: string, amt: string, dl: string) => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect wallet first",
      });
      return;
    }

    if (!desc || !amt || !dl) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all fields",
      });
      return;
    }

    setIsSubmitting(true);
    setTxStatus("Preparing transaction...");
    
    try {
      const farcasterUsername = providerUser?.username || `wallet-${address.slice(0, 6)}`;
      const amountInWei = parseUnits(amt, 18);
      const deadlineTimestamp = Math.floor(new Date(dl).getTime() / 1000);

      // Check if current time is valid
      if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
        toast({
          variant: "destructive",
          title: "Invalid Deadline",
          description: "Deadline must be in the future",
        });
        setIsSubmitting(false);
        setTxStatus("");
        return;
      }

      // Step 1: Check allowance first (with error handling)
      setTxStatus("Checking token allowance...");
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      
      let allowance: bigint = BigInt(0);
      try {
        allowance = await publicClient.readContract({
          address: CONTRACTS.COMMIT_TOKEN as `0x${string}`,
          abi: COMMIT_TOKEN_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, CONTRACTS.REMINDER_VAULT as `0x${string}`],
        }) as bigint;
        
        // If allowance is undefined or null, default to 0
        if (!allowance && allowance !== BigInt(0)) {
          allowance = BigInt(0);
        }
      } catch (allowanceError: any) {
        console.warn("[CreateReminder] Allowance check failed, assuming 0:", allowanceError?.message || allowanceError);
        // If allowance check fails, assume 0 and proceed with approval
        allowance = BigInt(0);
      }

      // Step 2: Approve if needed
      if (!allowance || allowance < amountInWei) {
        setTxStatus("Approving tokens... Please confirm in wallet.");
        try {
          const approveTxHash = await writeContractAsync({
            address: CONTRACTS.COMMIT_TOKEN as `0x${string}`,
            abi: COMMIT_TOKEN_ABI,
            functionName: 'approve',
            args: [CONTRACTS.REMINDER_VAULT as `0x${string}`, amountInWei],
            chainId: 8453, // Base Mainnet - explicitly specify to avoid getChainId error
          });
          
          console.log("[CreateReminder] Approval transaction sent:", approveTxHash);
          setTxStatus("Waiting for approval confirmation...");
          
          // Wait for approval to be confirmed with shorter timeout and polling fallback
          let approvalConfirmed = false;
          try {
            // Try to wait for receipt with shorter timeout (30 seconds)
            const approveReceipt = await publicClient.waitForTransactionReceipt({
              hash: approveTxHash,
              timeout: 30000, // 30 seconds timeout (reduced from 2 minutes)
            });
            
            console.log("[CreateReminder] Approval receipt received:", {
              status: approveReceipt.status,
              blockNumber: approveReceipt.blockNumber
            });
            
            if (approveReceipt.status !== "success") {
              throw new Error("Approval transaction failed");
            }
            
            approvalConfirmed = true;
            setTxStatus("Approval confirmed! Creating reminder...");
          } catch (waitError: any) {
            // If waitForTransactionReceipt fails or times out, verify transaction was sent
            console.warn("[CreateReminder] Wait for receipt failed/timeout, verifying transaction:", waitError?.message || waitError);
            
            // Verify transaction exists in mempool/blockchain
            try {
              const tx = await publicClient.getTransaction({ hash: approveTxHash });
              if (tx) {
                console.log("[CreateReminder] Transaction found in mempool, waiting for confirmation...");
                setTxStatus("Approval transaction sent, waiting for confirmation...");
                
                // Poll for allowance instead of waiting for receipt
                // This is more reliable as it checks the actual state
                let attempts = 0;
                const maxAttempts = 20; // 20 attempts = ~40 seconds
                const pollInterval = 2000; // Check every 2 seconds
                
                while (attempts < maxAttempts && !approvalConfirmed) {
                  await new Promise(resolve => setTimeout(resolve, pollInterval));
                  
                  try {
                    // Check if allowance was updated
                    const currentAllowance = await publicClient.readContract({
                      address: CONTRACTS.COMMIT_TOKEN as `0x${string}`,
                      abi: COMMIT_TOKEN_ABI,
                      functionName: 'allowance',
                      args: [address as `0x${string}`, CONTRACTS.REMINDER_VAULT as `0x${string}`],
                    }) as bigint;
                    
                    console.log("[CreateReminder] Checking allowance:", {
                      current: currentAllowance.toString(),
                      required: amountInWei.toString(),
                      sufficient: currentAllowance >= amountInWei
                    });
                    
                    if (currentAllowance >= amountInWei) {
                      console.log("[CreateReminder] ✅ Allowance confirmed via polling!");
                      approvalConfirmed = true;
                      setTxStatus("Approval confirmed! Creating reminder...");
                      break;
                    }
                  } catch (allowanceError: any) {
                    console.warn("[CreateReminder] Allowance check failed during polling:", allowanceError?.message);
                    // Continue polling
                  }
                  
                  attempts++;
                }
                
                if (!approvalConfirmed) {
                  // Transaction was sent but allowance not updated yet
                  // Proceed anyway - transaction is in mempool and will be confirmed
                  console.log("[CreateReminder] ⚠️ Allowance not confirmed yet, but transaction is in mempool. Proceeding...");
                  setTxStatus("Approval sent! Creating reminder...");
                  // Wait a bit more for transaction to be included
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              } else {
                throw new Error("Transaction not found in mempool");
              }
            } catch (txError: any) {
              console.error("[CreateReminder] Failed to verify transaction:", txError);
              // If we can't verify, throw original error
              throw waitError;
            }
          }
          
          // Small delay to ensure state is updated
          if (approvalConfirmed) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (approveError: any) {
          if (approveError.message?.includes("User rejected") || approveError.code === 4001) {
            throw new Error("Approval cancelled by user");
          }
          throw approveError;
        }
      }

      // Step 3: Create reminder
      setTxStatus("Creating reminder... Please confirm in wallet.");
      const createTxHash = await writeContractAsync({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'createReminder',
        args: [amountInWei, BigInt(deadlineTimestamp), desc, farcasterUsername],
        chainId: 8453, // Base Mainnet - explicitly specify to avoid getChainId error
      });

      setTxStatus("Waiting for transaction confirmation...");
      
      // Wait for create reminder transaction to be confirmed
      const createReceipt = await publicClient.waitForTransactionReceipt({
        hash: createTxHash,
      });
      
      if (createReceipt.status === "success") {
        setTxStatus("");
        toast({
          variant: "success",
          title: "Success!",
          description: "Reminder created successfully! Transaction confirmed.",
        });
        
        // Wait for blockchain state to update (optimized to save quota)
        // Only refresh once after transaction confirmation
        setTimeout(() => {
          refreshReminders();
          refreshBalance();
        }, 3000); // Single refresh after 3 seconds (reduced from multiple refreshes)
        
        setIsSubmitting(false);
      } else {
        throw new Error("Transaction reverted");
      }
      
    } catch (error: any) {
      console.error("Create reminder error:", error);
      setTxStatus("");
      setIsSubmitting(false);
      
      // Better error messages
      if (error.message?.includes("User rejected") || error.code === 4001 || error.message?.includes("cancelled")) {
        toast({
          variant: "destructive",
          title: "Transaction Cancelled",
          description: "Transaction cancelled by user",
        });
      } else if (error.message?.includes("insufficient funds")) {
        toast({
          variant: "destructive",
          title: "Insufficient Funds",
          description: "Insufficient funds for gas or tokens",
        });
      } else if (error.message?.includes("reverted") || error.shortMessage?.includes("reverted")) {
        toast({
          variant: "destructive",
          title: "Transaction Reverted",
          description: "Transaction reverted. Please check: Token balance is sufficient, Deadline is in the future, Contract address is correct",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Create Reminder",
          description: error.shortMessage || error.message || "Unknown error",
        });
      }
    }
  };

  // Confirm reminder function (V4)
  const confirmReminder = async (id: number) => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect wallet first",
      });
      return;
    }

    setIsSubmitting(true);
    setTxStatus("Confirming reminder... Please confirm in wallet.");
    try {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const txHash = await writeContractAsync({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'confirmReminder',
        args: [BigInt(id)],
        chainId: 8453, // Base Mainnet - explicitly specify to avoid getChainId error
      });

      setTxStatus("Waiting for transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "success") {
        setTxStatus("");
        toast({
          variant: "success",
          title: "Success!",
          description: "Reminder confirmed! Tokens returned.",
        });
        refreshReminders();
        refreshBalance();
      } else {
        throw new Error("Transaction reverted");
      }
    } catch (error: any) {
      console.error("Confirm reminder error:", error);
      setTxStatus("");
      if (error.message?.includes("User rejected") || error.code === 4001) {
        toast({
          variant: "destructive",
          title: "Transaction Cancelled",
          description: "Transaction cancelled by user",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Confirm Reminder",
          description: error.shortMessage || error.message || "Failed to confirm reminder",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Help remind function (V4)
  const helpRemind = async (reminder: any, isMiniApp: boolean, fid: number) => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect wallet first",
      });
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
        toast({
          variant: "destructive",
          title: "Failed to Record Reminder",
          description: data.error || "Failed to record reminder",
        });
        return;
      }

      // Then claim reward
      setIsSubmitting(true);
      setTxStatus("Claiming reward... Please confirm in wallet.");
      try {
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        const txHash = await writeContractAsync({
          address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
          abi: REMINDER_VAULT_ABI,
          functionName: 'claimReward',
          args: [BigInt(reminder.id)],
          chainId: 8453, // Base Mainnet - explicitly specify to avoid getChainId error
        });

        setTxStatus("Waiting for transaction confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        if (receipt.status === "success") {
          setTxStatus("");
          toast({
            variant: "success",
            title: "Reward Claimed!",
            description: `You earned ${data.data?.estimatedReward || "tokens"}`,
          });
          refreshReminders();
          refreshBalance();
        } else {
          throw new Error("Transaction reverted");
        }
      } catch (error: any) {
        console.error("Claim reward error:", error);
        setTxStatus("");
        if (error.message?.includes("User rejected") || error.code === 4001) {
          toast({
            variant: "destructive",
            title: "Transaction Cancelled",
            description: "Transaction cancelled by user",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Failed to Claim Reward",
            description: error.shortMessage || error.message || "Failed to claim reward",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Help remind error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Help Remind",
        description: error.message || "Failed to help remind",
      });
    }
  };

  return {
    createReminder,
    confirmReminder,
    helpRemind,
    isSubmitting,
    txStatus,
  };
}
