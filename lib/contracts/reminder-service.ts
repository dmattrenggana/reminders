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
  private isVerified = false

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
        "https://base-rpc.publicnode.com",
      ].filter(Boolean) as string[]

      let provider = null

      for (let i = 0; i < rpcEndpoints.length; i++) {
        const rpcUrl = rpcEndpoints[i]
        try {
          const testProvider = new JsonRpcProvider(rpcUrl, 8453)

          await Promise.race([
            testProvider.getNetwork(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
          ])

          provider = testProvider
          break
        } catch (e) {
          continue
        }
      }

      if (!provider) {
        throw new Error("Could not connect to Base Mainnet. All RPC endpoints failed.")
      }

      this.provider = provider

      this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V3_ABI, this.provider)
      this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, this.provider)

      try {
        const verifyWithRetry = async (attempts = 3) => {
          for (let i = 0; i < attempts; i++) {
            try {
              await Promise.race([
                this.vaultContract.nextReminderId(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
              ])
              this.isVerified = true
              return
            } catch (error) {
              if (i < attempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
              }
            }
          }
          throw new Error("Contract verification timeout")
        }

        await verifyWithRetry()
      } catch (verifyError) {
        this.isVerified = false
      }
    } catch (error) {
      console.error("Contract initialization error:", error)
      throw error
    }
  }

  private async ensureContracts() {
    if (this.initPromise) await this.initPromise

    if (!this.isVerified && this.vaultContract) {
      try {
        await Promise.race([
          this.vaultContract.nextReminderId(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ])
        this.isVerified = true
      } catch (verifyError) {
        console.error("Lazy verification failed:", verifyError)
      }
    }

    if (!this.vaultContract || !this.tokenContract) {
      throw new Error("Contracts not initialized")
    }

    await this.ensureSigner()

    if (this.signer && typeof this.signer.getAddress === "function") {
      const { Contract } = await import("ethers")
      this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V3_ABI, this.signer)
      this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, this.signer)
    } else {
      throw new Error("Wallet not connected. Please connect your wallet to perform transactions.")
    }
  }

  private async ensureSigner(): Promise<void> {
    let activeSigner = this.signer

    const frameProvider = (window as any).__frameEthProvider
    const frameSigner = (window as any).__frameSigner
    const webSigner = (window as any).__webSigner

    if (frameSigner) {
      activeSigner = frameSigner
    } else if (webSigner) {
      activeSigner = webSigner
    } else if (frameProvider) {
      try {
        const { BrowserProvider } = await import("ethers")
        const provider = new BrowserProvider(frameProvider)
        activeSigner = await provider.getSigner()
        ;(window as any).__frameSigner = activeSigner
      } catch (error) {
        console.error("Failed to create miniapp signer:", error)
        throw new Error("Failed to setup wallet for transactions. Please reload the app and try again.")
      }
    } else if (window?.ethereum) {
      try {
        const { BrowserProvider } = await import("ethers")
        const provider = new BrowserProvider(window.ethereum)
        activeSigner = await provider.getSigner()
        ;(window as any).__webSigner = activeSigner
      } catch (error) {
        console.error("Failed to create web wallet signer:", error)
        throw new Error("Failed to connect to your wallet. Please reconnect and try again.")
      }
    }

    this.signer = activeSigner
  }

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

  async approveTokens(amount: string): Promise<void> {
    try {
      await this.ensureContracts()
      const amountInWei = parseUnits(amount, 18)
      const tx = await this.tokenContract.approve(CONTRACTS.REMINDER_VAULT, amountInWei)
      await tx.wait()
    } catch (error) {
      console.error("Error approving tokens:", error)
      throw error
    }
  }

  async createReminder(
    tokenAmount: string,
    reminderTime: Date,
    description: string,
    farcasterUsername?: string,
    onProgress?: (status: string) => void,
  ): Promise<number> {
    try {
      onProgress?.("Initializing contracts...")

      await this.ensureContracts()

      if (!this.signer || typeof this.signer.getAddress !== "function") {
        throw new Error("Wallet not connected properly. Please reconnect and try again.")
      }

      let userAddress: string
      try {
        userAddress = await this.signer.getAddress()
      } catch (signerError) {
        console.error("Error getting signer address:", signerError)
        throw new Error("Could not access wallet. Please reconnect and try again.")
      }

      const amountInWei = parseUnits(tokenAmount, 18)
      const reminderTimestamp = Math.floor(reminderTime.getTime() / 1000)

      onProgress?.("Checking token balance...")
      const balance = await this.tokenContract.balanceOf(userAddress)

      if (balance < amountInWei) {
        throw new Error(
          `Insufficient token balance. You have ${formatUnits(balance, 18)} tokens but need ${tokenAmount}`,
        )
      }

      onProgress?.("Checking token allowance...")
      const currentAllowance = await this.tokenContract.allowance(userAddress, CONTRACTS.REMINDER_VAULT)

      if (currentAllowance < amountInWei) {
        onProgress?.("Requesting token approval...")

        const approveTx = await this.tokenContract.approve(CONTRACTS.REMINDER_VAULT, amountInWei)

        onProgress?.("Waiting for approval confirmation...")

        await approveTx.wait()
      }

      onProgress?.("Creating reminder...")

      const username = farcasterUsername || `wallet-${userAddress.slice(0, 6)}`

      const createTx = await this.vaultContract.createReminder(amountInWei, reminderTimestamp, description, username)

      onProgress?.("Waiting for confirmation...")

      const receipt = await createTx.wait()

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
        return reminderId
      }

      throw new Error("Failed to get reminder ID from event")
    } catch (error: any) {
      console.error("Error in createReminder:", error)
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        throw new Error("Transaction rejected by user")
      }
      if (error.message?.includes("insufficient allowance")) {
        throw new Error("Token approval failed. Please try again.")
      }
      if (error.message?.includes("insufficient funds")) {
        throw new Error("Insufficient gas or token balance")
      }
      if (error.message?.includes("Wallet not connected")) {
        throw error
      }
      throw new Error(error.message || "Failed to create reminder. Please try again.")
    }
  }

  async confirmReminder(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      const tx = await this.vaultContract.confirmReminder(reminderId)
      await tx.wait()
    } catch (error: any) {
      console.error("Error confirming reminder:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }

  async burnMissedReminder(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      const tx = await this.vaultContract.burnMissedReminder(reminderId)
      await tx.wait()
    } catch (error) {
      console.error("Error burning reminder:", error)
      throw error
    }
  }

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
          console.error(`getUserReminderIds attempt ${attempt + 1} failed:`, error?.message || error)
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }

      console.error("All getUserReminderIds attempts failed:", lastError?.message || lastError)
      throw new Error(
        "Vault contract not responding at " + CONTRACTS.REMINDER_VAULT + ". Verify it's deployed on Base Mainnet.",
      )
    } catch (error: any) {
      console.error("getUserReminderIds error:", error?.message || error)
      throw error
    }
  }

  async getReminder(reminderId: number): Promise<ReminderData> {
    try {
      await this.ensureContracts()
      const data = await this.vaultContract.reminders(reminderId)

      if (data.length === 11) {
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
          confirmationTime: BigInt(0),
        }
      } else if (data.length === 12) {
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
      console.error("Error getting reminder:", reminderId, error)
      throw error
    }
  }

  async getReminderRecords(reminderId: number): Promise<string[]> {
    try {
      await this.ensureContracts()
      const addresses = await this.vaultContract.getRemindersFor(reminderId)
      return addresses
    } catch (error) {
      console.error("Error getting reminder records:", error)
      throw error
    }
  }

  async recordReminder(reminderId: number, neynarScore: number): Promise<void> {
    try {
      await this.ensureContracts()
      const tx = await this.vaultContract.recordReminder(reminderId, neynarScore)
      await tx.wait()
    } catch (error: any) {
      console.error("Error recording reminder:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }

  async claimReward(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      const tx = await this.vaultContract.claimReward(reminderId)
      await tx.wait()
    } catch (error: any) {
      console.error("Error claiming reward:", error)
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
      console.error("Error calculating reward:", error)
      return "0"
    }
  }

  async canClaimReward(reminderId: number, claimer: string): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.canClaimReward(reminderId, claimer)
    } catch (error) {
      console.error("Error checking canClaimReward:", error)
      return false
    }
  }

  async canConfirm(reminderId: number): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.canConfirm(reminderId)
    } catch (error) {
      console.error("Error checking canConfirm:", error)
      return false
    }
  }

  async shouldBurn(reminderId: number): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.shouldBurn(reminderId)
    } catch (error) {
      console.error("Error checking shouldBurn:", error)
      return false
    }
  }

  async getUserReminders(address: string): Promise<ReminderData[]> {
    try {
      await this.ensureContracts()
      const ids = await this.getUserReminderIds(address)
      const reminders = await Promise.all(ids.map((id) => this.getReminder(id)))
      return reminders
    } catch (error) {
      console.error("Error getting user reminders with details:", error)
      throw error
    }
  }

  async getUnclaimedRewardPool(reminderId: number): Promise<string> {
    try {
      await this.ensureContracts()
      const unclaimedAmount = await this.vaultContract.getUnclaimedAmount(reminderId)
      return Math.floor(Number(formatUnits(unclaimedAmount, 18))).toString()
    } catch (error) {
      console.error("Error getting unclaimed reward pool:", error)
      return "0"
    }
  }

  async canWithdrawUnclaimed(reminderId: number): Promise<boolean> {
    try {
      await this.ensureContracts()
      return await this.vaultContract.canWithdrawUnclaimed(reminderId)
    } catch (error) {
      console.error("Error checking canWithdrawUnclaimed:", error)
      return false
    }
  }

  async withdrawUnclaimedRewards(reminderId: number): Promise<void> {
    try {
      await this.ensureContracts()
      const tx = await this.vaultContract.withdrawUnclaimedRewards(reminderId)
      await tx.wait()
    } catch (error: any) {
      console.error("Error withdrawing unclaimed rewards:", error)
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction rejected by user")
      }
      throw error
    }
  }
}
