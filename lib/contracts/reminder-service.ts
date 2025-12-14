import { CONTRACTS, COMMIT_TOKEN_ABI, REMINDER_VAULT_V2_ABI } from "./config"
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
  private initPromise: Promise<void> | null = null

  constructor(signer: any) {
    this.signer = signer
    this.initPromise = this.initializeContracts()
  }

  private async initializeContracts() {
    if (typeof window === "undefined") return

    try {
      const { Contract } = await import("ethers")
      this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, this.signer)
      this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, this.signer)
      console.log("[v0] Contracts initialized successfully")
    } catch (error) {
      console.error("[v0] Error initializing contracts:", error)
      throw new Error("Failed to initialize contracts")
    }
  }

  private async ensureContracts() {
    if (this.initPromise) {
      await this.initPromise
    }

    if (!this.vaultContract || !this.tokenContract) {
      await this.initializeContracts()
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
      console.error("[v0] Error getting token balance:", error)
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
      onProgress?.("Initializing contracts...")

      console.log("[v0] Step 0: Ensuring contracts are initialized...")
      await this.ensureContracts()
      console.log("[v0] ✅ Contracts ready")

      const amountInWei = parseUnits(tokenAmount, 18)
      const reminderTimestamp = Math.floor(reminderTime.getTime() / 1000)

      console.log("[v0] Creating reminder with params:", {
        tokenAmount,
        amountInWei: amountInWei.toString(),
        reminderTimestamp,
        description,
        farcasterUsername: farcasterUsername || "wallet-user",
      })

      const userAddress = await this.signer.getAddress()
      console.log("[v0] User address:", userAddress)
      console.log("[v0] Vault contract:", CONTRACTS.REMINDER_VAULT)
      console.log("[v0] Token contract:", CONTRACTS.COMMIT_TOKEN)

      onProgress?.("Checking token allowance...")
      console.log("[v0] Step 1: Checking current token allowance...")
      const currentAllowance = await this.tokenContract.allowance(userAddress, CONTRACTS.REMINDER_VAULT)
      console.log("[v0] Current allowance:", currentAllowance.toString(), "Required:", amountInWei.toString())

      if (currentAllowance < amountInWei) {
        onProgress?.("Step 1/2: Requesting token approval...")
        console.log("[v0] Step 2: Insufficient allowance, requesting approval...")
        console.log("[v0] 🔵 USER ACTION REQUIRED: Please approve the token transaction in your wallet")

        const approveTx = await this.tokenContract.approve(CONTRACTS.REMINDER_VAULT, amountInWei)
        console.log("[v0] Approval transaction sent:", approveTx.hash)

        onProgress?.("Step 1/2: Waiting for approval confirmation...")
        console.log("[v0] Waiting for approval confirmation...")

        const approveReceipt = await approveTx.wait()
        console.log("[v0] ✅ Approval confirmed in block:", approveReceipt.blockNumber)

        const newAllowance = await this.tokenContract.allowance(userAddress, CONTRACTS.REMINDER_VAULT)
        console.log("[v0] New allowance after approval:", newAllowance.toString())

        if (newAllowance < amountInWei) {
          throw new Error("Approval failed: allowance not set correctly")
        }

        console.log("[v0] ✅ Approval successful! Moving to create reminder...")
        onProgress?.("Step 1/2: Approval complete! Preparing createReminder...")
      } else {
        console.log("[v0] Step 2: Sufficient allowance already exists, skipping approval")
        onProgress?.("Sufficient allowance exists, preparing transaction...")
      }

      console.log("[v0] Waiting 1 second for blockchain state to settle...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onProgress?.("Step 2/2: Creating reminder on vault contract...")
      console.log("[v0] ============================================")
      console.log("[v0] Step 3: NOW CALLING VAULT CONTRACT")
      console.log("[v0] ============================================")

      const username = farcasterUsername || `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
      console.log("[v0] Final parameters:")
      console.log("[v0] - Amount (wei):", amountInWei.toString())
      console.log("[v0] - Time (unix):", reminderTimestamp)
      console.log("[v0] - Description:", description)
      console.log("[v0] - Username:", username)
      console.log("[v0] - Vault address:", this.vaultContract.target || this.vaultContract.address)

      let createTx
      try {
        console.log("[v0] 🚀 Calling vaultContract.createReminder NOW...")
        createTx = await this.vaultContract.createReminder(amountInWei, reminderTimestamp, description, username)

        console.log("[v0] ✅ CreateReminder transaction sent:", createTx.hash)
        onProgress?.("Step 2/2: Waiting for confirmation...")
      } catch (vaultError: any) {
        console.error("[v0] ❌ VAULT CONTRACT CALL FAILED")
        console.error("[v0] Error:", vaultError)
        console.error("[v0] Error code:", vaultError.code)
        console.error("[v0] Error message:", vaultError.message)
        console.error("[v0] Error reason:", vaultError.reason)
        alert(`Vault contract error: ${vaultError.message || "Unknown error"}. Check console for details.`)

        if (vaultError.code === "ACTION_REJECTED" || vaultError.code === 4001) {
          throw new Error("Transaction rejected by user")
        }
        throw new Error(`Vault call failed: ${vaultError.message || vaultError.reason || "Unknown error"}`)
      }

      console.log("[v0] Step 4: Waiting for createReminder confirmation...")
      const receipt = await createTx.wait()
      console.log("[v0] ✅ CreateReminder confirmed in block:", receipt.blockNumber)

      onProgress?.("Reminder created successfully!")

      // Extract reminder ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          return this.vaultContract.interface.parseLog(log)?.name === "ReminderCreated"
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
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      if (error.message?.includes("insufficient allowance")) {
        throw new Error("Token approval failed. Please try again.")
      }
      if (error.message?.includes("insufficient funds")) {
        throw new Error("Insufficient gas or token balance")
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
      const ids = await this.vaultContract.getUserReminders(address)
      return ids.map((id: bigint) => Number(id))
    } catch (error) {
      console.error("[v0] Error getting user reminders:", error)
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

      console.log("[v0] Reminder data received:", {
        user: data[0],
        commitAmount: data[1].toString(),
        rewardPoolAmount: data[2].toString(),
        reminderTime: data[3].toString(),
        confirmationDeadline: data[4].toString(),
        confirmed: data[5],
        burned: data[6],
        description: data[7],
        farcasterUsername: data[8],
        totalReminders: Number(data[9]),
        rewardsClaimed: data[10].toString(),
      })

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
}
