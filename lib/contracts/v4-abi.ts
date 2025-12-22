/**
 * ReminderVaultV4 ABI
 * 30/70 split with fixed tier rewards
 */

import { parseAbi } from "viem";

export const REMINDER_VAULT_V4_ABI = parseAbi([
  // Main functions
  "function createReminder(uint256 totalAmount, uint256 reminderTime, string memory description, string memory farcasterUsername) returns (uint256)",
  "function recordReminder(uint256 reminderId, uint256 neynarScore)",
  "function claimReward(uint256 reminderId)",
  "function confirmReminder(uint256 reminderId)",
  "function reclaimReminder(uint256 reminderId)",
  "function burnMissedReminder(uint256 reminderId)",
  
  // View functions
  "function reminders(uint256 reminderId) view returns (address user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, uint256 confirmationDeadline, bool confirmed, bool burned, string memory description, string memory farcasterUsername, uint256 totalReminders, uint256 rewardsClaimed, uint256 confirmationTime)",
  "function helperRecords(uint256 reminderId, address helper) view returns (address helper, uint256 neynarScore, bool claimed, uint256 rewardAmount)",
  "function getHelpersFor(uint256 reminderId) view returns (address[] memory)",
  "function getUserReminders(address user) view returns (uint256[] memory)",
  "function canRemind(uint256 reminderId) view returns (bool)",
  "function getActiveReminders() view returns (uint256[] memory)",
  "function nextReminderId() view returns (uint256)",
  
  // Constants
  "function TIER_HIGH() view returns (uint256)",
  "function TIER_MEDIUM() view returns (uint256)",
  "function TIER_LOW() view returns (uint256)",
  
  // Events
  "event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, string description, string farcasterUsername)",
  "event UserReminded(uint256 indexed reminderId, address indexed remindedBy, uint256 neynarScore, uint256 timestamp)",
  "event RewardClaimed(uint256 indexed reminderId, address indexed claimer, uint256 amount)",
  "event ReminderConfirmed(uint256 indexed reminderId, address indexed user, uint256 timestamp)",
  "event ReminderReclaimed(uint256 indexed reminderId, address indexed user, uint256 commitAmount, uint256 unclaimedRewards)",
  "event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 commitAmount)",
  "event RewardPoolReturned(uint256 indexed reminderId, address indexed user, uint256 rewardPoolAmount)",
]);
