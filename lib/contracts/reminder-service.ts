import { Contract, parseUnits, formatUnits } from "ethers"
import { CONTRACTS, COMMIT_TOKEN_ABI, REMINDER_VAULT_ABI } from "./config"
import type { JsonRpcSigner } from "ethers"

export interface ReminderData {
  id: number
  user: string
  tokenAmount: bigint
  reminderTime: bigint
  confirmationDeadline: bigint
  confirmed: boolean
  burned: boolean
  description: string
}

export class ReminderService {
  private vaultContract: Contract
  private tokenContract: Contract
  private signer: JsonRpcSigner

  constructor(signer: JsonRpcSigner) {
    this.signer = signer
    this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_ABI, signer)
    this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, signer)
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<string> {
    try {
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
      const amountInWei = parseUnits(tokenAmount, 18)
      const reminderTimestamp = Math.floor(reminderTime.getTime() / 1000)

      console.log("[v0] Creating reminder with params:", {
        tokenAmount,
        amountInWei: amountInWei.toString(),
        reminderTimestamp,
        description,
      })

      // First approve tokens
      await this.approveTokens(tokenAmount)

      // Then create reminder
      const tx = await this.vaultContract.createReminder(amountInWei, reminderTimestamp, description)

      const receipt = await tx.wait()
      console.log("[v0] Reminder created, transaction hash:", receipt.hash)

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
        console.log("[v0] Reminder ID:", reminderId)
        return reminderId
      }

      throw new Error("Failed to get reminder ID from event")
    } catch (error: any) {
      console.error("[v0] Error creating reminder:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }

  /**
   * Confirm a reminder and reclaim tokens
   */
  async confirmReminder(reminderId: number): Promise<void> {
    try {
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
      const data = await this.vaultContract.getReminder(reminderId)
      return {
        id: reminderId,
        user: data[0],
        tokenAmount: data[1],
        reminderTime: data[2],
        confirmationDeadline: data[3],
        confirmed: data[4],
        burned: data[5],
        description: data[6],
      }
    } catch (error) {
      console.error("[v0] Error getting reminder:", error)
      throw error
    }
  }

  /**
   * Check if a reminder can be confirmed
   */
  async canConfirm(reminderId: number): Promise<boolean> {
    try {
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
      const ids = await this.getUserReminderIds(address)
      const reminders = await Promise.all(ids.map((id) => this.getReminder(id)))
      return reminders
    } catch (error) {
      console.error("[v0] Error getting user reminders with details:", error)
      throw error
    }
  }
}
