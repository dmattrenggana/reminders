/**
 * ReminderVaultV5 ABI
 * 30/70 split with EIP-712 signature verification
 * No recordReminder - direct claimReward with signature
 */

import { parseAbi } from "viem";

export const REMINDER_VAULT_V5_ABI = parseAbi([
  // Write functions
  "function createReminder(uint256 totalAmount, uint256 deadline, string memory description, string memory farcasterUsername) returns (uint256)",
  "function claimReward(uint256 reminderId, uint256 neynarScore, bytes memory signature)",
  "function reclaimReminder(uint256 reminderId)",
  "function burnMissedReminder(uint256 reminderId)",
  
  // Read functions
  "function reminders(uint256 reminderId) view returns (address user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 deadline, bool resolved, uint256 rewardsClaimed, string memory description, string memory farcasterUsername)",
  "function hasClaimed(uint256 reminderId, address helper) view returns (bool)",
  "function getUserReminders(address user) view returns (uint256[] memory)",
  "function getActiveReminders() view returns (uint256[] memory)",
  "function getRemainingPool(uint256 reminderId) view returns (uint256)",
  "function isClaimWindowOpen(uint256 reminderId) view returns (bool)",
  "function nextReminderId() view returns (uint256)",
  "function signerAddress() view returns (address)",
  
  // Constants
  "function TIER_HIGH() view returns (uint256)",
  "function TIER_MEDIUM() view returns (uint256)",
  "function TIER_LOW() view returns (uint256)",
  
  // Events
  "event ReminderCreated(uint256 indexed id, address indexed user, uint256 total, uint256 deadline)",
  "event RewardClaimed(uint256 indexed id, address indexed helper, uint256 amount)",
  "event ReminderReclaimed(uint256 indexed id, address indexed user, uint256 amountReturned)",
  "event ReminderBurned(uint256 indexed id, uint256 burnedAmount, uint256 returnedToUser)",
]);

