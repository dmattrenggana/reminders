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
  totalReminders: number
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

  constructor(signer: any) {
    this.signer = signer

    // Import Contract dynamically to avoid SSR issues
    if (typeof window !== "undefined") {
      const initContracts = async () => {
        try {
          const { Contract } = await import("ethers")
          this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, signer)
          this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, signer)
        } catch (error) {
          console.error("[v0] Error initializing contracts:", error)
          throw new Error("Failed to initialize contracts")
        }
      }
      initContracts()
    }
  }

  private async ensureContracts() {
    if (!this.vaultContract || !this.tokenContract) {
      const { Contract } = await import("ethers")
      this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V2_ABI, this.signer)
      this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, this.signer)
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
  async createReminder(tokenAmount: string, reminderTime: Date, description: string): Promise<number> {
    try {
      await this.ensureContracts()
      const amountInWei = parseUnits(tokenAmount, 18)
      const reminderTimestamp = Math.floor(reminderTime.getTime() / 1000)

      console.log("[v0] Creating reminder with params:", {
        tokenAmount,
        amountInWei: amountInWei.toString(),
        reminderTimestamp,
        description,
      })

      console.log("[v0] Step 1: Approving tokens...")
      await this.approveTokens(tokenAmount)
      console.log("[v0] Step 1: Token approval complete")

      console.log("[v0] Step 2: Creating reminder on contract...")
      const tx = await this.vaultContract.createReminder(amountInWei, reminderTimestamp, description)
      console.log("[v0] Step 2: Transaction sent, hash:", tx.hash)

      console.log("[v0] Step 3: Waiting for transaction confirmation...")
      const receipt = await tx.wait()
      console.log("[v0] Step 3: Transaction confirmed, receipt:", receipt.hash)

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
        console.log("[v0] Reminder created successfully with ID:", reminderId)
        return reminderId
      }

      throw new Error("Failed to get reminder ID from event")
    } catch (error: any) {
      console.error("[v0] Error creating reminder:", error)
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
      const data = await this.vaultContract.getReminder(reminderId)
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
        totalReminders: Number(data[8]),
      }
    } catch (error) {
      console.error("[v0] Error getting reminder:", error)
      throw error
    }
  }

  async getReminderRecords(reminderId: number): Promise<ReminderRecord> {
    try {
      await this.ensureContracts()
      const data = await this.vaultContract.getReminders(reminderId)
      return {
        remindedBy: data[0],
        scores: data[1],
        claimed: data[2],
      }
    } catch (error) {
      console.error("[v0] Error getting reminder records:", error)
      throw error
    }
  }

  async recordReminder(reminderId: number, remindedBy: string, neynarScore: number): Promise<void> {
    try {
      await this.ensureContracts()
      console.log("[v0] Recording reminder:", { reminderId, remindedBy, neynarScore })
      const tx = await this.vaultContract.recordReminder(reminderId, remindedBy, neynarScore)
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
