import { CONTRACTS, COMMIT_TOKEN_ABI, REMINDER_VAULT_V3_ABI } from "./config"
import { parseUnits, formatUnits } from "@/lib/utils/ethers-utils"

export interface ReminderData {
  id: number
  user: string
  commitmentAmount: bigint
  rewardPoolAmount: bigint
  reminderTime: bigint
  confirmationDeadline: bigint
  confirmed: boolean
  burned: boolean
  description: string
  farcasterUsername: string
  totalReminders: number
  rewardsClaimed: bigint
  confirmationTime: bigint // Added confirmationTime field for V3
}

export interface ReminderRecord {
  remindedBy: string[]
  scores: bigint[]
  claimed: boolean[]
}

export class ReminderService {
  private vaultContract: any
  private tokenContract: any
  private signer: any
  private provider: any
  private initPromise: Promise<void> | null = null

  constructor(signer: any) {
    this.signer = signer
    this.initPromise = this.initializeContracts()
  }

  private async initializeContracts() {
    if (typeof window === "undefined") return

    try {
      const { Contract, JsonRpcProvider } = await import("ethers")

      if (!CONTRACTS.COMMIT_TOKEN || !CONTRACTS.REMINDER_VAULT) {
        throw new Error("Contract addresses not configured")
      }

      const rpcEndpoints = [
        process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
      ].filter(Boolean) as string[]

      let provider = null

      for (const rpcUrl of rpcEndpoints) {
        try {
          const testProvider = new JsonRpcProvider(rpcUrl, 8453)
          await Promise.race([
            testProvider.getNetwork(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
          ])

          provider = testProvider
          break
        } catch {
          continue
        }
      }

      if (!provider) {
        throw new Error("Could not connect to Base Mainnet")
      }

      this.provider = provider
      this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V3_ABI, this.provider)
      this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, this.provider)
    } catch (error) {
      console.error("Contract initialization error:", error)
      throw error
    }
  }

  private async ensureContracts() {
    if (this.initPromise) await this.initPromise
    if (!this.vaultContract || !this.tokenContract) {
      throw new Error("Contracts not initialized")
    }

    if (typeof window !== "undefined") {
      const frameProvider = (window as any).__frameEthProvider
      if (frameProvider) {
        try {
          console.log("[v0] Setting up Frame SDK signer for contract operation")
          const { BrowserProvider, Contract } = await import("ethers")
          const provider = new BrowserProvider(frameProvider)
          const signer = await provider.getSigner()

          // Update contracts with the signer for write operations
          this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V3_ABI, signer)
          this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, signer)
          this.signer = signer
          console.log("[v0] Contracts updated with Frame SDK signer")
        } catch (error) {
          console.error("[v0] Error setting up Frame SDK signer:", error)
        }
      }
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<string> {
    try {
      await this.ensureContracts()
      const balance = await this.tokenContract.balanceOf(address)
      return Math.floor(Number(formatUnits(balance, 18))).toString()
    } catch (error) {
      console.error("Error getting token balance:", error)
      throw error
    }
  }

  /**
   * Approve tokens for the vault contract
   */
  async approveTokens(amount: string): Promise<void> {
    try {
      await this.ensureContracts()
      const amountInWei = parseUnits(amount, 18)
      const tx = await this.tokenContract.approve(CONTRACTS.REMINDER_VAULT, amountInWei)
      await tx.wait()
      console.log("[v0] Token approval successful")
    } catch (error) {
      console.error("[v0] Error approving tokens:", error)
      throw error
    }
  }

  /**
   * Create a new reminder with token commitment
   */
  async createReminder(
    tokenAmount: string,
    reminderTime: Date,
    description: string,
    farcasterUsername?: string,
    onProgress?: (status: string) => void,
  ): Promise<number> {
    try {
      console.log("[v0] ========== STARTING REMINDER CREATION ==========")
      console.log("[v0] Parameters:", { tokenAmount, reminderTime, description, farcasterUsername })
      onProgress?.("Initializing contracts...")

      await this.ensureContracts()

      if (!this.signer) {
        console.error("[v0] No signer available after ensureContracts")
        throw new Error("No signer available. Please connect your wallet.")
      }

      console.log("[v0] Getting signer address...")
      let userAddress: string
      try {
        userAddress = await this.signer.getAddress()
        console.log("[v0] User address:", userAddress)
      } catch (signerError) {
        console.error("[v0] Error getting signer address:", signerError)
        throw new Error("Could not get wallet address. Please reconnect.")
      }

      const amountInWei = parseUnits(tokenAmount, 18)
      const reminderTimestamp = Math.floor(reminderTime.getTime() / 1000)

      console.log("[v0] Creating reminder with params:", {
        tokenAmount,
        amountInWei: amountInWei.toString(),
        reminderTimestamp,
        description,
        farcasterUsername: farcasterUsername || "wallet-user",
      })

      console.log("[v0] Vault contract:", CONTRACTS.REMINDER_VAULT)
      console.log("[v0] Token contract:", CONTRACTS.COMMIT_TOKEN)

      onProgress?.("Checking token balance...")
      console.log("[v0] Step 1: Checking token balance...")
      const balance = await this.tokenContract.balanceOf(userAddress)
      console.log("[v0] Token balance:", balance.toString(), "Required:", amountInWei.toString())

      if (balance < amountInWei) {
        throw new Error(
          `Insufficient token balance. You have ${formatUnits(balance, 18)} tokens but need ${tokenAmount}`,
        )
      }

      onProgress?.("Checking token allowance...")
      console.log("[v0] Step 2: Checking current token allowance...")
      const currentAllowance = await this.tokenContract.allowance(userAddress, CONTRACTS.REMINDER_VAULT)
      console.log("[v0] Current allowance:", currentAllowance.toString(), "Required:", amountInWei.toString())

      if (currentAllowance < amountInWei) {
        onProgress?.("Requesting token approval...")
        console.log("[v0] Step 3: Insufficient allowance, requesting approval...")
        console.log("[v0] 🔵 USER ACTION REQUIRED: Please approve the token transaction in your wallet")

        const approveTx = await this.tokenContract.approve(CONTRACTS.REMINDER_VAULT, amountInWei)
        console.log("[v0] Approval transaction sent:", approveTx.hash)

        onProgress?.("Waiting for approval confirmation...")
        console.log("[v0] Waiting for approval confirmation...")

        const approveReceipt = await approveTx.wait()
        console.log("[v0] ✅ Approval confirmed in block:", approveReceipt.blockNumber)
      } else {
        console.log("[v0] Step 3: Sufficient allowance already exists, skipping approval")
      }

      onProgress?.("Creating reminder...")
      console.log("[v0] Step 4: Calling vault contract createReminder...")

      const username = farcasterUsername || `wallet-${userAddress.slice(0, 6)}`

      console.log("[v0] 🚀 Calling vaultContract.createReminder with params:")
      console.log("[v0]   - totalAmount (wei):", amountInWei.toString())
      console.log("[v0]   - reminderTime:", reminderTimestamp)
      console.log("[v0]   - description:", description)
      console.log("[v0]   - farcasterUsername:", username)

      const createTx = await this.vaultContract.createReminder(amountInWei, reminderTimestamp, description, username)

      console.log("[v0] ✅ CreateReminder transaction sent:", createTx.hash)
      onProgress?.("Waiting for confirmation...")

      const receipt = await createTx.wait()
      console.log("[v0] ✅ CreateReminder confirmed in block:", receipt.blockNumber)

      onProgress?.("Reminder created successfully!")

      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.vaultContract.interface.parseLog(log)
          return parsed?.name === "ReminderCreated"
        } catch {
          return false
        }
      })

      if (event) {
        const parsed = this.vaultContract.interface.parseLog(event)
        const reminderId = Number(parsed?.args[0])
        console.log("[v0] ✅✅✅ Reminder created successfully with ID:", reminderId)
        console.log("[v0] ========== REMINDER CREATION COMPLETE ==========")
        return reminderId
      }

      throw new Error("Failed to get reminder ID from event")
    } catch (error: any) {
      console.error("[v0] ❌ ERROR IN createReminder:", error)
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        throw new Error("Transaction rejected by user")
      }
      if (error.message?.includes("insufficient allowance")) {
        throw new Error("Token approval failed. Please try again.")
      }
      if (error.message?.includes("insufficient funds")) {
        throw new Error("Insufficient gas or token balance")
      }
      if (error.message?.includes("Insufficient token balance")) {
        throw error
      }
      throw new Error(error.message || "Failed to create reminder")
    }
  }

  /**
   * Confirm a reminder and reclaim tokens
   */
  async confirmReminder(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      console.log("[v0] Confirming reminder:", reminderId)
      const tx = await this.vaultContract.confirmReminder(reminderId)
      await tx.wait()
      console.log("[v0] Reminder confirmed successfully")
    } catch (error: any) {
      console.error("[v0] Error confirming reminder:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }

  /**
   * Burn tokens for a missed reminder
   */
  async burnMissedReminder(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      console.log("[v0] Burning tokens for reminder:", reminderId)
      const tx = await this.vaultContract.burnMissedReminder(reminderId)
      await tx.wait()
      console.log("[v0] Tokens burned successfully")
    } catch (error) {
      console.error("[v0] Error burning reminder:", error)
      throw error
    }
  }

  /**
   * Get all reminder IDs for a user
   */
  async getUserReminderIds(address: string): Promise<number[]> {
    try {
      await this.ensureContracts()

      if (!this.vaultContract) {
        throw new Error("Vault contract not initialized")
      }

      let lastError: any
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const ids = await this.vaultContract.getUserReminders(address)
          return ids.map((id: bigint) => Number(id))
        } catch (error: any) {
          lastError = error
          console.error(`[v0] getUserReminderIds attempt ${attempt + 1} failed:`, error?.message || error)
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }

      console.error("[v0] All getUserReminderIds attempts failed:", lastError?.message || lastError)
      throw new Error(
        "Vault contract not responding at " + CONTRACTS.REMINDER_VAULT + ". Verify it's deployed on Base Mainnet.",
      )
    } catch (error: any) {
      console.error("[v0] getUserReminderIds error:", error?.message || error)
      throw error
    }
  }

  /**
   * Get reminder details
   */
  async getReminder(reminderId: number): Promise<ReminderData> {
    try {
      await this.ensureContracts()
      console.log("[v0] Fetching reminder data for ID:", reminderId)
      const data = await this.vaultContract.reminders(reminderId)

      console.log("[v0] Reminder data array length:", data.length)
      console.log("[v0] Full data array:", data)

      if (data.length === 11) {
        console.warn("[v0] ⚠️ Contract appears to be V2 (11 fields), not V3 (12 fields)")
        return {
          id: reminderId,
          user: data[0],
          commitmentAmount: data[1],
          rewardPoolAmount: data[2],
          reminderTime: data[3],
          confirmationDeadline: data[4],
          confirmed: data[5],
          burned: data[6],
          description: data[7],
          farcasterUsername: data[8],
          totalReminders: Number(data[9]),
          rewardsClaimed: data[10],
          confirmationTime: BigInt(0), // Default value for V2
        }
      } else if (data.length === 12) {
        console.log("[v0] ✅ Contract is V3 (12 fields)")
        return {
          id: reminderId,
          user: data[0],
          commitmentAmount: data[1],
          rewardPoolAmount: data[2],
          reminderTime: data[3],
          confirmationDeadline: data[4],
          confirmed: data[5],
          burned: data[6],
          description: data[7],
          farcasterUsername: data[8],
          totalReminders: Number(data[9]),
          rewardsClaimed: data[10],
          confirmationTime: data[11],
        }
      } else {
        throw new Error(`Unexpected data length: ${data.length}. Expected 11 (V2) or 12 (V3)`)
      }
    } catch (error) {
      console.error("[v0] Error getting reminder:", reminderId, error)
      throw error
    }
  }

  async getReminderRecords(reminderId: number): Promise<string[]> {
    try {
      await this.ensureContracts()
      const addresses = await this.vaultContract.getRemindersFor(reminderId)
      return addresses
    } catch (error) {
      console.error("[v0] Error getting reminder records:", error)
      throw error
    }
  }

  async recordReminder(reminderId: number, neynarScore: number): Promise<void> {
    try {
      await this.ensureContracts()
      console.log("[v0] Recording reminder:", { reminderId, neynarScore })
      const tx = await this.vaultContract.recordReminder(reminderId, neynarScore)
      await tx.wait()
      console.log("[v0] Reminder recorded successfully")
    } catch (error: any) {
      console.error("[v0] Error recording reminder:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }

  async claimReward(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      console.log("[v0] Claiming reward for reminder:", reminderId)
      const tx = await this.vaultContract.claimReward(reminderId)
      await tx.wait()
      console.log("[v0] Reward claimed successfully")
    } catch (error: any) {
      console.error("[v0] Error claiming reward:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }

  async calculateReward(reminderId: number, claimer: string): Promise<string> {
    try {
      await this.ensureContracts()
      const reward = await this.vaultContract.calculateReward(reminderId, claimer)
      return Math.floor(Number(formatUnits(reward, 18))).toString()
    } catch (error) {
      console.error("[v0] Error calculating reward:", error)
      return "0"
    }
  }

  async canClaimReward(reminderId: number, claimer: string): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.canClaimReward(reminderId, claimer)
    } catch (error) {
      console.error("[v0] Error checking canClaimReward:", error)
      return false
    }
  }

  /**
   * Check if a reminder can be confirmed
   */
  async canConfirm(reminderId: number): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.canConfirm(reminderId)
    } catch (error) {
      console.error("[v0] Error checking canConfirm:", error)
      return false
    }
  }

  /**
   * Check if a reminder should be burned
   */
  async shouldBurn(reminderId: number): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.shouldBurn(reminderId)
    } catch (error) {
      console.error("[v0] Error checking shouldBurn:", error)
      return false
    }
  }

  /**
   * Get all reminders with full details for a user
   */
  async getUserReminders(address: string): Promise<ReminderData[]> {
    try {
      await this.ensureContracts()
      const ids = await this.getUserReminderIds(address)
      const reminders = await Promise.all(ids.map((id) => this.getReminder(id)))
      return reminders
    } catch (error) {
      console.error("[v0] Error getting user reminders with details:", error)
      throw error
    }
  }

  /**
   * Get unclaimed reward pool amount for a confirmed reminder
   */
  async getUnclaimedRewardPool(reminderId: number): Promise<string> {
    try {
      await this.ensureContracts()
      const unclaimedAmount = await this.vaultContract.getUnclaimedAmount(reminderId)
      return Math.floor(Number(formatUnits(unclaimedAmount, 18))).toString()
    } catch (error) {
      console.error("[v0] Error getting unclaimed reward pool:", error)
      return "0"
    }
  }

  /**
   * Check if user can withdraw unclaimed rewards (V3 feature)
   */
  async canWithdrawUnclaimed(reminderId: number): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.canWithdrawUnclaimed(reminderId)
    } catch (error) {
      console.error("[v0] Error checking canWithdrawUnclaimed:", error)
      return false
    }
  }

  /**
   * Withdraw unclaimed rewards after 24 hours (V3 feature)
   */
  async withdrawUnclaimedRewards(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      console.log("[v0] Withdrawing unclaimed rewards for reminder:", reminderId)
      const tx = await this.vaultContract.withdrawUnclaimedRewards(reminderId)
      await tx.wait()
      console.log("[v0] Unclaimed rewards withdrawn successfully")
    } catch (error: any) {
      console.error("[v0] Error withdrawing unclaimed rewards:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }
}
