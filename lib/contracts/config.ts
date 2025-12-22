/**
 * Contract addresses and configuration for Base Mainnet
 *
 * SECURITY NOTE: These NEXT_PUBLIC_ variables contain blockchain contract addresses,
 * which are public information visible on the blockchain explorer. They are NOT
 * authentication tokens or API keys. Client-side access is required for Web3 interactions.
 */

import { parseAbi } from "viem";

export const CONTRACT_ADDRESSES = {
  COMMIT_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  REMINDER_VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT || "",
} as const

export const CONTRACTS = {
  // Blockchain contract addresses (public data, safe to expose)
  COMMIT_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  REMINDER_VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT || "",
}

export const CHAIN_CONFIG = {
  BASE_MAINNET: {
    chainId: 8453,
    name: "Base",
    rpcUrls: ["https://mainnet.base.org", "https://base.llamarpc.com", "https://base-rpc.publicnode.com"],
    rpcUrl: "https://mainnet.base.org", // Default
    blockExplorer: "https://basescan.org",
  },
}

export const TOKEN_SYMBOL = "RMND"

export function validateContractConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!CONTRACTS.COMMIT_TOKEN) {
    errors.push("NEXT_PUBLIC_CONTRACT_ADDRESS is not set")
  } else if (!CONTRACTS.COMMIT_TOKEN.startsWith("0x") || CONTRACTS.COMMIT_TOKEN.length !== 42) {
    errors.push("NEXT_PUBLIC_CONTRACT_ADDRESS is not a valid Ethereum address")
  }

  if (!CONTRACTS.REMINDER_VAULT) {
    errors.push("NEXT_PUBLIC_VAULT_CONTRACT is not set")
  } else if (!CONTRACTS.REMINDER_VAULT.startsWith("0x") || CONTRACTS.REMINDER_VAULT.length !== 42) {
    errors.push("NEXT_PUBLIC_VAULT_CONTRACT is not a valid Ethereum address")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const COMMIT_TOKEN_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
])

export const REMINDER_VAULT_V2_ABI = [
  "function createReminder(uint256 tokenAmount, uint256 reminderTime, string memory description, string memory farcasterUsername) returns (uint256)",
  "function confirmReminder(uint256 reminderId)",
  "function burnMissedReminder(uint256 reminderId)",
  "function recordReminder(uint256 reminderId, uint256 neynarScore)",
  "function claimReward(uint256 reminderId)",
  "function getUserReminders(address user) view returns (uint256[])",
  "function reminders(uint256 reminderId) view returns (address user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, uint256 confirmationDeadline, bool confirmed, bool burned, string memory description, string memory farcasterUsername, uint256 totalReminders, uint256 rewardsClaimed)",
  "function getRemindersFor(uint256 reminderId) view returns (address[] memory)",
  "function canRemind(uint256 reminderId) view returns (bool)",
  "function getActiveReminders() view returns (uint256[] memory)",
  "function nextReminderId() view returns (uint256)",
  "event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, string description, string farcasterUsername)",
  "event ReminderConfirmed(uint256 indexed reminderId, address indexed user, uint256 timestamp)",
  "event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 commitAmount)",
  "event RewardPoolReturned(uint256 indexed reminderId, address indexed user, uint256 rewardPoolAmount)",
  "event UserReminded(uint256 indexed reminderId, address indexed remindedBy, uint256 neynarScore, uint256 timestamp)",
  "event RewardClaimed(uint256 indexed reminderId, address indexed claimer, uint256 amount)",
] as const

export const REMINDER_VAULT_V1_ABI = [
  "function createReminder(uint256 tokenAmount, uint256 reminderTime, string memory description) returns (uint256)",
  "function confirmReminder(uint256 reminderId)",
  "function burnMissedReminder(uint256 reminderId)",
  "function getUserReminders(address user) view returns (uint256[])",
  "function getReminder(uint256 reminderId) view returns (address user, uint256 tokenAmount, uint256 reminderTime, uint256 confirmationDeadline, bool confirmed, bool burned, string memory description)",
  "function canConfirm(uint256 reminderId) view returns (bool)",
  "function shouldBurn(uint256 reminderId) view returns (bool)",
  "event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 tokenAmount, uint256 reminderTime, string description)",
  "event ReminderConfirmed(uint256 indexed reminderId, address indexed user, uint256 timestamp)",
  "event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 tokenAmount)",
  "event TokensReclaimed(uint256 indexed reminderId, address indexed user, uint256 tokenAmount)",
] as const

export const REMINDER_VAULT_V3_ABI = [
  "function createReminder(uint256 totalAmount, uint256 reminderTime, string memory description, string memory farcasterUsername) returns (uint256)",
  "function confirmReminder(uint256 reminderId)",
  "function burnMissedReminder(uint256 reminderId)",
  "function recordReminder(uint256 reminderId, uint256 neynarScore)",
  "function claimReward(uint256 reminderId)",
  "function withdrawUnclaimedRewards(uint256 reminderId)",
  "function getUserReminders(address user) view returns (uint256[])",
  "function reminders(uint256 reminderId) view returns (address user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, uint256 confirmationDeadline, bool confirmed, bool burned, string memory description, string memory farcasterUsername, uint256 totalReminders, uint256 rewardsClaimed, uint256 confirmationTime)",
  "function getRemindersFor(uint256 reminderId) view returns (address[] memory)",
  "function canRemind(uint256 reminderId) view returns (bool)",
  "function canWithdrawUnclaimed(uint256 reminderId) view returns (bool)",
  "function getUnclaimedAmount(uint256 reminderId) view returns (uint256)",
  "function getActiveReminders() view returns (uint256[] memory)",
  "function nextReminderId() view returns (uint256)",
  "event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, string description, string farcasterUsername)",
  "event ReminderConfirmed(uint256 indexed reminderId, address indexed user, uint256 timestamp)",
  "event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 commitAmount)",
  "event RewardPoolReturned(uint256 indexed reminderId, address indexed user, uint256 rewardPoolAmount)",
  "event UserReminded(uint256 indexed reminderId, address indexed remindedBy, uint256 neynarScore, uint256 timestamp)",
  "event RewardClaimed(uint256 indexed reminderId, address indexed claimer, uint256 amount)",
  "event UnclaimedRewardsWithdrawn(uint256 indexed reminderId, address indexed user, uint256 amount)",
] as const

// Import V4 ABI (30/70 split with fixed tier rewards)
import { REMINDER_VAULT_V4_ABI } from "./v4-abi"

// Default ABI: Use V4 (latest version)
export const REMINDER_VAULT_ABI = REMINDER_VAULT_V4_ABI
export const REMINDER_VAULT_V4_ABI_EXPORT = REMINDER_VAULT_V4_ABI

// Export aliases for backward compatibility
export const VAULT_ABI = REMINDER_VAULT_ABI
export const VAULT_ADDRESS = CONTRACTS.REMINDER_VAULT
export const TOKEN_ADDRESS = CONTRACTS.COMMIT_TOKEN
