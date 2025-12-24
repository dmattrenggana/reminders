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
        const allowanceResult = await publicClient.readContract({
          address: CONTRACTS.COMMIT_TOKEN as `0x${string}`,
          abi: COMMIT_TOKEN_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, CONTRACTS.REMINDER_VAULT as `0x${string}`],
        });
        
        // Handle different return types and "0x" response
        if (allowanceResult === null || allowanceResult === undefined) {
          console.warn("[CreateReminder] Allowance returned null/undefined, assuming 0");
          allowance = BigInt(0);
        } else if (typeof allowanceResult === 'string' && allowanceResult === '0x') {
          // Contract returned "0x" (no data) - this means allowance is 0 or contract doesn't exist
          console.warn("[CreateReminder] Allowance returned '0x' (no data), assuming 0");
          allowance = BigInt(0);
        } else if (typeof allowanceResult === 'bigint') {
          allowance = allowanceResult;
        } else if (typeof allowanceResult === 'string') {
          try {
            allowance = BigInt(allowanceResult);
          } catch {
            console.warn("[CreateReminder] Failed to parse allowance string, assuming 0");
            allowance = BigInt(0);
          }
        } else {
          console.warn("[CreateReminder] Unexpected allowance type, assuming 0:", typeof allowanceResult);
          allowance = BigInt(0);
        }
      } catch (allowanceError: any) {
        // Handle "0x" response error specifically
        if (allowanceError?.message?.includes('returned no data') || 
            allowanceError?.message?.includes('0x') ||
            allowanceError?.data === '0x') {
          console.warn("[CreateReminder] Allowance check returned '0x' (contract may not exist or no allowance), assuming 0");
        } else {
          console.warn("[CreateReminder] Allowance check failed, assuming 0:", allowanceError?.message || allowanceError);
        }
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
                    const allowanceResult = await publicClient.readContract({
                      address: CONTRACTS.COMMIT_TOKEN as `0x${string}`,
                      abi: COMMIT_TOKEN_ABI,
                      functionName: 'allowance',
                      args: [address as `0x${string}`, CONTRACTS.REMINDER_VAULT as `0x${string}`],
                    });
                    
                    // Handle "0x" response and different types
                    let currentAllowance: bigint = BigInt(0);
                    if (allowanceResult === null || allowanceResult === undefined || 
                        (typeof allowanceResult === 'string' && allowanceResult === '0x')) {
                      currentAllowance = BigInt(0);
                    } else if (typeof allowanceResult === 'bigint') {
                      currentAllowance = allowanceResult;
                    } else if (typeof allowanceResult === 'string') {
                      try {
                        currentAllowance = BigInt(allowanceResult);
                      } catch {
                        currentAllowance = BigInt(0);
                      }
                    }
                    
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
                    // Suppress "0x" errors during polling - just continue
                    if (!allowanceError?.message?.includes('returned no data') && 
                        !allowanceError?.message?.includes('0x')) {
                      console.warn("[CreateReminder] Allowance check failed during polling:", allowanceError?.message);
                    }
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

      console.log("[CreateReminder] Create reminder transaction sent:", createTxHash);
      setTxStatus("Waiting for transaction confirmation...");
      
      // Wait for create reminder transaction to be confirmed with timeout
      let createReceipt;
      try {
        createReceipt = await publicClient.waitForTransactionReceipt({
          hash: createTxHash,
          timeout: 60000, // 60 seconds timeout
        });
        
        console.log("[CreateReminder] Create reminder receipt received:", {
          status: createReceipt.status,
          blockNumber: createReceipt.blockNumber
        });
      } catch (waitError: any) {
        // If waitForTransactionReceipt fails or times out, verify transaction exists
        console.warn("[CreateReminder] Wait for receipt failed/timeout, verifying transaction:", waitError?.message || waitError);
        
        // Verify transaction exists in mempool/blockchain
        try {
          const tx = await publicClient.getTransaction({ hash: createTxHash });
          if (tx) {
            console.log("[CreateReminder] Transaction found in mempool, checking status...");
            setTxStatus("Transaction sent! Waiting for confirmation...");
            
            // Try to get receipt with polling
            let attempts = 0;
            const maxAttempts = 15; // 15 attempts = ~30 seconds
            const pollInterval = 2000; // Check every 2 seconds
            
            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              
              try {
                const receipt = await publicClient.getTransactionReceipt({ hash: createTxHash });
                if (receipt) {
                  console.log("[CreateReminder] ✅ Receipt found via polling!");
                  createReceipt = receipt;
                  break;
                }
              } catch (receiptError: any) {
                // Receipt not ready yet, continue polling
                console.log(`[CreateReminder] Receipt not ready yet (attempt ${attempts + 1}/${maxAttempts})`);
              }
              
              attempts++;
            }
            
            // If still no receipt, proceed anyway - transaction is in mempool
            if (!createReceipt) {
              console.log("[CreateReminder] ⚠️ Receipt not found yet, but transaction is in mempool. Proceeding...");
              setTxStatus("Transaction sent! It will be confirmed shortly.");
              // Don't throw error - transaction was sent successfully
              // User can check transaction status manually
              toast({
                title: "Reminder creation initiated",
                description: `Transaction sent! Check status: ${createTxHash.slice(0, 10)}...`,
              });
              refreshReminders();
              refreshBalance();
              setIsSubmitting(false);
              setTxStatus("");
              return; // Exit early - transaction is processing
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
      
      if (createReceipt.status === "success") {
        setTxStatus("");
        setIsSubmitting(false);
        
        // Show success toast (non-blocking, don't wait for it)
        // Use setTimeout to make it non-blocking
        setTimeout(() => {
          toast({
            variant: "default",
            title: "✅ Reminder Created!",
            description: "Your reminder has been successfully created and locked.",
            duration: 5000,
          });
        }, 100);
        
        // Wait for blockchain state to update (optimized to save quota)
        // Only refresh once after transaction confirmation
        setTimeout(() => {
          refreshReminders();
          refreshBalance();
        }, 3000); // Single refresh after 3 seconds (reduced from multiple refreshes)
        
        // Return success immediately to allow FloatingCreate to close
        // Don't wait for toast or refresh
        return { success: true, receipt: createReceipt };
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
  // Note: confirmReminder returns 30% commitment
  // reclaimReminder returns 30% + unclaimed 70%, but requires reminder NOT confirmed
  // So we use reclaimReminder if at T-1 hour (before deadline), or confirmReminder if at deadline
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

      // Check current time vs reminder time to decide which function to call
      // Get reminder data from contract
      const reminderData = await publicClient.readContract({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'reminders',
        args: [BigInt(id)],
      }) as any;

      const reminderTime = Number(reminderData[3]); // reminderTime is at index 3
      const currentTime = Math.floor(Date.now() / 1000);
      const oneHourBefore = reminderTime - 3600;

      // If at T-1 hour (before deadline), use reclaimReminder (returns 30% + unclaimed 70%)
      // If at deadline or after, use confirmReminder (returns 30% only)
      if (currentTime >= oneHourBefore && currentTime < reminderTime) {
        // T-1 hour window: Use reclaimReminder (more tokens returned)
        setTxStatus("Reclaiming reminder... Please confirm in wallet.");
        const reclaimTxHash = await writeContractAsync({
          address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
          abi: REMINDER_VAULT_ABI,
          functionName: 'reclaimReminder',
          args: [BigInt(id)],
          chainId: 8453,
        });

        setTxStatus("Waiting for reclaim transaction...");
        const reclaimReceipt = await publicClient.waitForTransactionReceipt({
          hash: reclaimTxHash,
          timeout: 60000,
        });

        if (reclaimReceipt.status === "success") {
          setTxStatus("");
          toast({
            variant: "success",
            title: "Success!",
            description: "Reminder reclaimed! 30% commitment + unclaimed rewards returned.",
          });
          refreshReminders();
          refreshBalance();
        } else {
          throw new Error("Reclaim reminder transaction failed");
        }
      } else {
        // At deadline or after: Use confirmReminder (returns 30% commitment)
        const confirmTxHash = await writeContractAsync({
          address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
          abi: REMINDER_VAULT_ABI,
          functionName: 'confirmReminder',
          args: [BigInt(id)],
          chainId: 8453,
        });

        setTxStatus("Waiting for confirmation transaction...");
        const confirmReceipt = await publicClient.waitForTransactionReceipt({
          hash: confirmTxHash,
          timeout: 60000,
        });

        if (confirmReceipt.status === "success") {
          setTxStatus("");
          toast({
            variant: "success",
            title: "Success!",
            description: "Reminder confirmed! 30% commitment returned.",
          });
          refreshReminders();
          refreshBalance();
        } else {
          throw new Error("Confirm reminder transaction failed");
        }
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

  // Help remind function (V4) - With Farcaster posting flow
  const helpRemind = async (reminder: any, isMiniApp: boolean, fid: number) => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect wallet first",
      });
      return;
    }

    setIsSubmitting(true);
    setTxStatus("Preparing reminder post...");

    try {
      // Step 1: Format reminder time and deadline
      let reminderTime: Date;
      if (typeof reminder.reminderTime === 'number') {
        reminderTime = new Date(reminder.reminderTime * 1000);
      } else if (reminder.deadline && typeof reminder.deadline === 'number') {
        reminderTime = new Date(reminder.deadline * 1000);
      } else {
        reminderTime = new Date(reminder.reminderTime || reminder.deadline);
      }
      
      const formattedDeadline = reminderTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Step 2: Create post template with mention using the specified template
      const creatorUsername = reminder.farcasterUsername || reminder.creatorUsername || "creator";
      const reminderDescription = reminder.description || "reminder";
      const appUrl = "https://remindersbase.vercel.app/";
      
      const postText = `Tick-tock, @${creatorUsername} ! ⏰ Don't forget your ${reminderDescription} is approaching at ${formattedDeadline}. Beat the clock and get it done now! ${appUrl}`;

      // Step 3: Post to Farcaster (if in miniapp)
      if (isMiniApp && typeof window !== 'undefined' && (window as any).Farcaster?.sdk) {
        try {
          setTxStatus("Opening Farcaster to post...");
          const sdk = (window as any).Farcaster.sdk;
          
          // Use Farcaster SDK to open composer
          if (sdk.actions && sdk.actions.openComposer) {
            await sdk.actions.openComposer({
              text: postText,
            });
            
            setTxStatus("Waiting for you to post and return...");
            toast({
              variant: "default",
              title: "Post in Farcaster",
              description: "Please post the reminder and mention the creator, then return to this app.",
            });
            
            // Wait a bit for user to post
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            // Fallback: Open Warpcast URL
            const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`;
            window.open(warpcastUrl, '_blank');
            setTxStatus("Please post in Warpcast and return...");
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (postError: any) {
          console.warn("Farcaster posting error (non-critical):", postError);
          // Continue anyway - user can post manually
        }
      } else {
        // Web browser: Open Warpcast in new tab
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`;
        window.open(warpcastUrl, '_blank');
        setTxStatus("Please post in Warpcast and return...");
        toast({
          variant: "default",
          title: "Post in Warpcast",
          description: "Please post the reminder and mention the creator, then return to this app.",
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Step 4: Wait for user to post and return to app, then verify post via Neynar API
      // When user returns to miniapp, trigger verification and claim automatically
      setTxStatus("Waiting for you to post and return to app...");
      
      // Poll for user return and verify post
      let verificationAttempts = 0;
      const maxVerificationAttempts = 30; // 30 attempts = ~30 seconds (poll every 1 second)
      let verificationSuccess = false;
      let verificationData: any = null;
      
      while (verificationAttempts < maxVerificationAttempts && !verificationSuccess) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
        
        try {
          setTxStatus(`Verifying your post... (${verificationAttempts + 1}/${maxVerificationAttempts})`);
          
          // Verify post via Neynar API and get reward calculation
          const response = await fetch("/api/reminders/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reminderId: reminder.id,
              helperAddress: address,
              helperFid: fid,
              creatorUsername: creatorUsername,
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            verificationSuccess = true;
            verificationData = data;
            break; // Exit polling loop
          } else {
            // Post not verified yet, continue polling
            verificationAttempts++;
            if (verificationAttempts >= maxVerificationAttempts) {
              throw new Error(data.message || "Post verification timeout. Please ensure you posted the reminder with mention.");
            }
          }
        } catch (error: any) {
          // If it's a verification error (not found), continue polling
          if (error.message?.includes("verification failed") || error.message?.includes("Post verification")) {
            verificationAttempts++;
            if (verificationAttempts >= maxVerificationAttempts) {
              throw new Error("Post verification timeout. Please ensure you posted the reminder and mentioned the creator.");
            }
            continue;
          }
          // Other errors should be thrown immediately
          throw error;
        }
      }
      
      if (!verificationSuccess || !verificationData) {
        throw new Error("Post verification timeout. Please ensure you posted the reminder and mentioned the creator.");
      }
      
      const data = verificationData;

      // Step 5: Call recordReminder contract with Neynar score
      setTxStatus("Recording reminder on-chain... Please confirm in wallet.");
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      // Neynar score is 0-1.0, but contract expects 0-100 (multiply by 100)
      const neynarScore = Math.floor((data.neynarScore || 0.5) * 100);
      
      const recordTxHash = await writeContractAsync({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'recordReminder',
        args: [BigInt(reminder.id), BigInt(neynarScore)],
        chainId: 8453,
      });

      setTxStatus("Waiting for record transaction confirmation...");
      const recordReceipt = await publicClient.waitForTransactionReceipt({
        hash: recordTxHash,
        timeout: 60000,
      });

      if (recordReceipt.status !== "success") {
        throw new Error("Record reminder transaction failed");
      }

      // Step 6: Auto claim reward immediately after recording
      setTxStatus("Claiming reward... Please confirm in wallet.");
      const claimTxHash = await writeContractAsync({
        address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
        abi: REMINDER_VAULT_ABI,
        functionName: 'claimReward',
        args: [BigInt(reminder.id)],
        chainId: 8453,
      });

      setTxStatus("Waiting for claim transaction confirmation...");
      const claimReceipt = await publicClient.waitForTransactionReceipt({
        hash: claimTxHash,
        timeout: 60000,
      });

      if (claimReceipt.status === "success") {
        setTxStatus("");
        toast({
          variant: "success",
          title: "Success!",
          description: `Reminder recorded and reward claimed! You earned ${data.estimatedReward || "tokens"}`,
        });
        refreshReminders();
        refreshBalance();
      } else {
        throw new Error("Claim reward transaction failed");
      }
    } catch (error: any) {
      console.error("Help remind error:", error);
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
          title: "Failed to Help Remind",
          description: error.shortMessage || error.message || "Failed to help remind",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createReminder,
    confirmReminder,
    helpRemind,
    isSubmitting,
    txStatus,
    setTxStatus,
  };
}
