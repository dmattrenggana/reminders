# Frontend Update: Automatic Verification

## Complete helpRemind Function with Supabase Realtime

Replace the entire `helpRemind` function in `hooks/use-reminder-actions.ts` (lines 507-908) with this new version:

\`\`\`typescript
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

    // Step 2: Get creator username
    let creatorUsername: string | null = null;
    
    if (reminder.farcasterUsername && reminder.farcasterUsername.trim() !== "") {
      const storedUsername = reminder.farcasterUsername.trim();
      if (!storedUsername.startsWith("wallet-") && !storedUsername.startsWith("0x")) {
        creatorUsername = storedUsername;
        console.log('[HelpRemind] ✅ Using username from reminder data:', creatorUsername);
      }
    }
    
    if (!creatorUsername && reminder.creator) {
      try {
        console.log('[HelpRemind] Fetching creator username from address:', reminder.creator);
        setTxStatus("Fetching creator information...");
        
        const creatorResponse = await fetch(`/api/farcaster/fid-by-address?address=${reminder.creator}`);
        
        if (!creatorResponse.ok) {
          throw new Error(`API returned status ${creatorResponse.status}`);
        }
        
        const creatorData = await creatorResponse.json();
        
        if (creatorData.user?.username) {
          creatorUsername = creatorData.user.username;
          console.log('[HelpRemind] ✅ Creator username fetched from API:', creatorUsername);
        } else if (creatorData.username) {
          creatorUsername = creatorData.username;
          console.log('[HelpRemind] ✅ Creator username from direct field:', creatorUsername);
        } else {
          console.warn('[HelpRemind] ⚠️ Creator username not found in API response:', creatorData);
        }
      } catch (error: any) {
        console.error('[HelpRemind] ❌ Failed to fetch creator username:', error);
      }
    }
    
    if (!creatorUsername || creatorUsername.startsWith("wallet-") || creatorUsername.startsWith("0x")) {
      if (reminder.creator) {
        console.error('[HelpRemind] ❌ Could not get valid creator username for address:', reminder.creator);
        throw new Error("Creator username not found. Please ensure the reminder creator has a Farcaster account linked to their wallet address.");
      } else {
        throw new Error("Reminder creator information not available.");
      }
    }
    
    console.log('[HelpRemind] Final creator username to use:', creatorUsername);
    
    const reminderDescription = reminder.description || "reminder";
    const appUrl = "https://remindersbase.vercel.app/";
    
    // Create post template
    const postText = `Tick-tock, @${creatorUsername} ! ⏰ Don't forget your ${reminderDescription} is approaching at ${formattedDeadline}. Beat the clock and get it done now! ${appUrl}`;
    
    console.log('[HelpRemind] Post template created:', {
      creatorUsername,
      reminderDescription,
      formattedDeadline,
      postText: postText.substring(0, 100) + '...',
    });

    // Step 3: Create pending verification in Supabase
    setTxStatus("Setting up verification...");
    console.log('[HelpRemind] Creating pending verification for reminder:', reminder.id);
    
    let verificationToken: string | null = null;
    try {
      const recordResponse = await fetch("/api/reminders/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderId: reminder.id,
          helperAddress: address,
          helperFid: fid,
          creatorUsername: creatorUsername,
          useSupabase: true, // Use Supabase, no webhook
        }),
      });

      if (!recordResponse.ok) {
        const errorData = await recordResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to create pending verification`);
      }

      const recordData = await recordResponse.json();
      
      if (!recordData.success) {
        throw new Error(recordData.message || recordData.error || "Failed to create pending verification");
      }

      verificationToken = recordData.verification_token;
      console.log('[HelpRemind] ✅ Pending verification created:', verificationToken);
    } catch (error: any) {
      console.error('[HelpRemind] ❌ Failed to create pending verification:', error);
      throw new Error(`Failed to setup verification: ${error.message}`);
    }

    if (!verificationToken) {
      throw new Error("Verification token not received. Please try again.");
    }

    // Step 4: Open Farcaster composer
    if (isMiniApp && typeof window !== 'undefined' && (window as any).Farcaster?.sdk) {
      try {
        setTxStatus("Opening Farcaster to post...");
        const sdk = (window as any).Farcaster.sdk;
        
        if (sdk.actions && sdk.actions.openComposer) {
          await sdk.actions.openComposer({
            text: postText,
          });
        } else {
          const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`;
          window.open(warpcastUrl, '_blank');
        }
      } catch (postError: any) {
        console.warn("Farcaster posting error (non-critical):", postError);
      }
    } else {
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postText)}`;
      window.open(warpcastUrl, '_blank');
    }

    // Step 5: START AUTOMATIC VERIFICATION (no user button needed!)
    setTxStatus("Waiting for your post (automatic verification)...");
    console.log('[HelpRemind] 🤖 Starting automatic verification. Token:', verificationToken);
    
    let verificationComplete = false;
    let verificationData: any = null;
    
    // Subscribe to Supabase Realtime for instant updates
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`verification-${verificationToken}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pending_verifications',
        filter: `id=eq.${verificationToken}`,
      }, (payload) => {
        console.log('[HelpRemind] 📡 Realtime update received:', payload);
        
        if (payload.new && (payload.new as any).status === 'verified') {
          verificationComplete = true;
          verificationData = {
            success: true,
            neynarScore: (payload.new as any).neynar_score,
            estimatedReward: (payload.new as any).estimated_reward,
          };
          console.log('[HelpRemind] ✅ Realtime: Post verified!', verificationData);
        }
      })
      .subscribe();

    // Start automatic background polling (every 5 seconds)
    const startTime = Date.now();
    const maxWaitTime = 3 * 60 * 1000; // 3 minutes max
    let pollCount = 0;
    
    const pollInterval = setInterval(async () => {
      if (verificationComplete) {
        clearInterval(pollInterval);
        channel.unsubscribe();
        return;
      }

      if (Date.now() - startTime > maxWaitTime) {
        clearInterval(pollInterval);
        channel.unsubscribe();
        return;
      }

      pollCount++;
      try {
        console.log(`[HelpRemind] 🔄 Auto-polling verification (attempt ${pollCount})`);
        
        const verifyResponse = await fetch("/api/verify-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationToken }),
        });

        if (!verifyResponse.ok) {
          console.log(`[HelpRemind] ⏳ Polling response not OK: ${verifyResponse.status}`);
          return; // Continue polling
        }

        const verifyData = await verifyResponse.json();
        
        if (verifyData.success && verifyData.status === 'verified') {
          clearInterval(pollInterval);
          channel.unsubscribe();
          
          if (!verificationComplete) {
            verificationComplete = true;
            verificationData = {
              success: true,
              neynarScore: verifyData.neynarScore,
              estimatedReward: verifyData.estimatedReward,
            };
            console.log('[HelpRemind] ✅ Polling: Post verified!', verificationData);
          }
        } else {
          console.log(`[HelpRemind] ⏳ Still waiting... Status: ${verifyData.status}`);
        }
      } catch (error: any) {
        console.warn('[HelpRemind] ⚠️ Polling error:', error.message);
      }
    }, 5000); // Poll every 5 seconds

    // Wait for verification (via Realtime or polling)
    const checkInterval = setInterval(() => {
      if (verificationComplete && verificationData) {
        clearInterval(checkInterval);
        clearInterval(pollInterval);
        channel.unsubscribe();
        
        // Proceed with reward immediately!
        proceedWithReward();
      }

      if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval);
        clearInterval(pollInterval);
        channel.unsubscribe();
        
        if (!verificationComplete) {
          setIsSubmitting(false);
          setTxStatus("");
          toast({
            title: "⏱️ Verification timeout",
            description: "Please ensure you posted the reminder and mentioned the creator.",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
    }, 1000);

    // Helper function to proceed with reward
    async function proceedWithReward() {
      try {
        if (!verificationData || !publicClient) {
          throw new Error("Verification data or public client not available");
        }

        // Step 6: Call recordReminder contract
        setTxStatus("✅ Post verified! Recording reminder...");
        
        const neynarScore = Math.floor((verificationData.neynarScore || 0.5) * 10000);
        
        const recordTxHash = await writeContractAsync({
          address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
          abi: REMINDER_VAULT_ABI,
          functionName: 'recordReminder',
          args: [BigInt(reminder.id), BigInt(neynarScore)],
          chainId: 8453,
        });

        setTxStatus("Confirming record transaction...");
        const recordReceipt = await publicClient.waitForTransactionReceipt({
          hash: recordTxHash,
          timeout: 120000,
        });

        if (recordReceipt.status !== "success") {
          throw new Error("Record reminder transaction failed");
        }

        // Step 7: Try to claim reward
        try {
          const reminderData = await publicClient.readContract({
            address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
            abi: REMINDER_VAULT_ABI,
            functionName: 'reminders',
            args: [BigInt(reminder.id)],
          }) as any;

          const confirmed = reminderData[5]; // confirmed field
          const deadline = Number(reminderData[4]); // confirmationDeadline
          const now = Math.floor(Date.now() / 1000);

          if (confirmed || now >= deadline) {
            setTxStatus("Claiming your reward...");
            
            const claimTxHash = await writeContractAsync({
              address: CONTRACTS.REMINDER_VAULT as `0x${string}`,
              abi: REMINDER_VAULT_ABI,
              functionName: 'claimReward',
              args: [BigInt(reminder.id)],
              chainId: 8453,
            });

            setTxStatus("Confirming claim transaction...");
            const claimReceipt = await publicClient.waitForTransactionReceipt({
              hash: claimTxHash,
              timeout: 120000,
            });

            if (claimReceipt.status === "success") {
              setTxStatus("");
              toast({
                variant: "default",
                title: "✅ Reward claimed!",
                description: `You earned ${verificationData.estimatedReward} tokens for helping!`,
                duration: 2000,
              });
              refreshReminders();
              refreshBalance();
              setIsSubmitting(false);
              return;
            }
          } else {
            setTxStatus("");
            toast({
              variant: "default",
              title: "✅ Reminder recorded!",
              description: "You can claim your reward after the creator confirms.",
              duration: 2000,
            });
            refreshReminders();
            refreshBalance();
            setIsSubmitting(false);
          }
        } catch (claimError: any) {
          console.warn("[HelpRemind] Claim reward not available yet:", claimError);
          setTxStatus("");
          toast({
            variant: "default",
            title: "✅ Reminder recorded!",
            description: "You can claim your reward after the creator confirms.",
            duration: 2000,
          });
          refreshReminders();
          refreshBalance();
          setIsSubmitting(false);
        }
      } catch (error: any) {
        console.error('[HelpRemind] Error in proceedWithReward:', error);
        setTxStatus("");
        toast({
          title: "❌ Transaction failed",
          description: error.message || "Please try again.",
          variant: "destructive",
          duration: 2000,
        });
        setIsSubmitting(false);
      }
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
    setIsSubmitting(false);
  }
};
\`\`\`

This new version:
- ✅ Uses Supabase Realtime for instant updates
- ✅ Automatic background polling every 5 seconds
- ✅ No "I Posted" button needed
- ✅ Fully automatic recordReminder + claimReward
- ✅ 3-minute timeout
- ✅ Clean error handling

Replace the old function and test!
