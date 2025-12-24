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

/**
 * Get RPC URLs with priority order (matching rpc-provider.ts configuration)
 * Premium RPC (from env) takes highest priority if configured
 */
function getRpcUrls(): string[] {
  const urls: string[] = [];

  // Priority 1: Premium RPC from environment (if configured)
  // Alchemy: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
  // Infura: https://base-mainnet.infura.io/v3/YOUR_API_KEY
  // QuickNode: https://YOUR-ENDPOINT-NAME.base.quiknode.pro/YOUR-API-KEY/
  const customRpc = process.env?.NEXT_PUBLIC_BASE_MAINNET_RPC_URL?.trim();
  if (customRpc && !customRpc.includes("mainnet.base.org")) {
    // Only add if it's not the default (which has rate limiting)
    urls.push(customRpc);
  }

  // Priority 2: Free reliable RPCs (less rate limiting)
  urls.push(
    "https://base.llamarpc.com", // LlamaRPC (free, reliable, less rate limiting)
    "https://base-rpc.publicnode.com", // PublicNode (free, reliable)
    "https://base.drpc.org", // dRPC (free tier, reliable)
    "https://base-mainnet.public.blastapi.io", // BlastAPI (free tier)
    "https://base.gateway.tenderly.co", // Tenderly Gateway
  );

  // Priority 3: Official Base RPC (moved lower due to frequent 429 rate limiting)
  urls.push("https://mainnet.base.org");

  return urls;
}

export const CHAIN_CONFIG = {
  BASE_MAINNET: {
    chainId: 8453,
    name: "Base",
    // RPC URLs with priority order (matching rpc-provider.ts and app/providers.tsx)
    // Note: mainnet.base.org moved lower due to frequent 429 rate limiting
    rpcUrls: getRpcUrls(),
    rpcUrl: getRpcUrls()[0] || "https://base.llamarpc.com", // Default: First in priority list
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
