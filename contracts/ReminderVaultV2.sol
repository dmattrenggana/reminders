// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReminderVaultV2
 * @dev Manages reminder commitments with social rewards
 * 50% of tokens go to commitment (burn if missed)
 * 50% go to reward pool for users who remind via Farcaster
 */
contract ReminderVaultV2 is ReentrancyGuard {
    IERC20 public commitToken;

    struct Reminder {
        address user;
        uint256 commitAmount; // 50% for commitment
        uint256 rewardPoolAmount; // 50% for rewards
        uint256 reminderTime;
        uint256 confirmationDeadline;
        bool confirmed;
        bool burned;
        string description;
        string farcasterUsername;
        uint256 totalReminders; // Count of users who reminded
        uint256 rewardsClaimed; // Total rewards claimed
    }

    struct RemindClaim {
        address reminder;
        uint256 neynarScore;
        bool claimed;
    }

    mapping(uint256 => Reminder) public reminders;
    mapping(uint256 => mapping(address => RemindClaim)) public remindClaims; // reminderId => address => claim
    mapping(uint256 => address[]) public reminderAddresses; // reminderId => list of reminders
    mapping(address => uint256[]) public userReminders;
    uint256 public nextReminderId;

    event ReminderCreated(
        uint256 indexed reminderId,
        address indexed user,
        uint256 commitAmount,
        uint256 rewardPoolAmount,
        uint256 reminderTime,
        string description,
        string farcasterUsername
    );

    event UserReminded(
        uint256 indexed reminderId,
        address indexed remindedBy,
        uint256 neynarScore,
        uint256 timestamp
    );

    event RewardClaimed(
        uint256 indexed reminderId,
        address indexed claimer,
        uint256 amount
    );

    event ReminderConfirmed(
        uint256 indexed reminderId,
        address indexed user,
        uint256 timestamp
    );

    event TokensBurned(
        uint256 indexed reminderId,
        address indexed user,
        uint256 commitAmount
    );

    event RewardPoolReturned(
        uint256 indexed reminderId,
        address indexed user,
        uint256 rewardPoolAmount
    );

    constructor(address _commitToken) {
        commitToken = IERC20(_commitToken);
    }

    /**
     * @dev Create a new reminder with 50/50 split
     */
    function createReminder(
        uint256 totalAmount,
        uint256 reminderTime,
        string memory description,
        string memory farcasterUsername
    ) external nonReentrant returns (uint256) {
        require(totalAmount > 0 && totalAmount % 2 == 0, "Amount must be even and > 0");
        require(reminderTime > block.timestamp, "Reminder time must be in future");
        require(bytes(description).length > 0, "Description required");
        require(bytes(farcasterUsername).length > 0, "Farcaster username required");

        require(
            commitToken.transferFrom(msg.sender, address(this), totalAmount),
            "Token transfer failed"
        );

        uint256 reminderId = nextReminderId++;
        uint256 commitAmount = totalAmount / 2;
        uint256 rewardPoolAmount = totalAmount / 2;
        uint256 confirmationDeadline = reminderTime + 1 hours;

        reminders[reminderId] = Reminder({
            user: msg.sender,
            commitAmount: commitAmount,
            rewardPoolAmount: rewardPoolAmount,
            reminderTime: reminderTime,
            confirmationDeadline: confirmationDeadline,
            confirmed: false,
            burned: false,
            description: description,
            farcasterUsername: farcasterUsername,
            totalReminders: 0,
            rewardsClaimed: 0
        });

        userReminders[msg.sender].push(reminderId);

        emit ReminderCreated(
            reminderId,
            msg.sender,
            commitAmount,
            rewardPoolAmount,
            reminderTime,
            description,
            farcasterUsername
        );

        return reminderId;
    }

    /**
     * @dev Record that a user reminded someone (called after Farcaster post)
     */
    function recordReminder(
        uint256 reminderId,
        uint256 neynarScore
    ) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.user != address(0), "Reminder does not exist");
        require(reminder.user != msg.sender, "Cannot remind yourself");
        require(!reminder.confirmed && !reminder.burned, "Reminder already resolved");
        require(block.timestamp >= reminder.reminderTime - 1 hours, "Too early to remind");
        require(block.timestamp <= reminder.confirmationDeadline, "Reminder expired");
        require(!remindClaims[reminderId][msg.sender].claimed, "Already reminded");
        require(neynarScore > 0, "Invalid Neynar score");

        remindClaims[reminderId][msg.sender] = RemindClaim({
            reminder: msg.sender,
            neynarScore: neynarScore,
            claimed: false
        });

        reminderAddresses[reminderId].push(msg.sender);
        reminder.totalReminders++;

        emit UserReminded(reminderId, msg.sender, neynarScore, block.timestamp);
    }

    /**
     * @dev Claim reward for reminding a user
     */
    function claimReward(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        RemindClaim storage claim = remindClaims[reminderId][msg.sender];

        require(claim.reminder == msg.sender, "No reminder record");
        require(!claim.claimed, "Already claimed");
        require(reminder.confirmed, "Reminder not confirmed yet");
        require(reminder.rewardPoolAmount > reminder.rewardsClaimed, "No rewards left");

        // Calculate reward based on Neynar score weight
        uint256 totalScore = _getTotalNeynarScore(reminderId);
        uint256 userReward = (reminder.rewardPoolAmount * claim.neynarScore) / totalScore;

        claim.claimed = true;
        reminder.rewardsClaimed += userReward;

        require(
            commitToken.transfer(msg.sender, userReward),
            "Reward transfer failed"
        );

        emit RewardClaimed(reminderId, msg.sender, userReward);
    }

    /**
     * @dev Confirm reminder and enable reward claims
     */
    function confirmReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        
        require(reminder.user == msg.sender, "Not reminder owner");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Tokens already burned");
        
        uint256 notificationStartTime = reminder.reminderTime - 1 hours;
        require(
            block.timestamp >= notificationStartTime,
            "Too early to confirm"
        );
        require(
            block.timestamp <= reminder.confirmationDeadline,
            "Confirmation deadline passed"
        );

        reminder.confirmed = true;

        // Return commit amount to user
        require(
            commitToken.transfer(msg.sender, reminder.commitAmount),
            "Commit token return failed"
        );

        emit ReminderConfirmed(reminderId, msg.sender, block.timestamp);
    }

    /**
     * @dev Burn commit amount and return reward pool for missed reminder
     */
    function burnMissedReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        
        require(!reminder.confirmed, "Reminder was confirmed");
        require(!reminder.burned, "Already burned");
        require(
            block.timestamp > reminder.confirmationDeadline,
            "Deadline not passed yet"
        );

        reminder.burned = true;

        // Burn commit amount
        require(
            commitToken.transfer(address(0xdead), reminder.commitAmount),
            "Token burn failed"
        );

        // Return reward pool to user
        require(
            commitToken.transfer(reminder.user, reminder.rewardPoolAmount),
            "Reward pool return failed"
        );

        emit TokensBurned(reminderId, reminder.user, reminder.commitAmount);
        emit RewardPoolReturned(reminderId, reminder.user, reminder.rewardPoolAmount);
    }

    /**
     * @dev Get total Neynar score for all reminders
     */
    function _getTotalNeynarScore(uint256 reminderId) private view returns (uint256) {
        uint256 total = 0;
        address[] memory remindersFor = reminderAddresses[reminderId];
        
        for (uint256 i = 0; i < remindersFor.length; i++) {
            total += remindClaims[reminderId][remindersFor[i]].neynarScore;
        }
        
        return total;
    }

    /**
     * @dev Get all active reminders (public feed)
     */
    function getActiveReminders() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count active reminders
        for (uint256 i = 0; i < nextReminderId; i++) {
            Reminder memory reminder = reminders[i];
            if (!reminder.confirmed && !reminder.burned && 
                block.timestamp < reminder.confirmationDeadline) {
                count++;
            }
        }
        
        // Collect active reminder IDs
        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextReminderId; i++) {
            Reminder memory reminder = reminders[i];
            if (!reminder.confirmed && !reminder.burned && 
                block.timestamp < reminder.confirmationDeadline) {
                activeIds[index] = i;
                index++;
            }
        }
        
        return activeIds;
    }

    /**
     * @dev Check if reminder is in remind window (1 hour before deadline)
     */
    function canRemind(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        return block.timestamp >= reminder.reminderTime - 1 hours &&
               block.timestamp <= reminder.confirmationDeadline &&
               !reminder.confirmed &&
               !reminder.burned;
    }

    
    function getUserReminders(address user) external view returns (uint256[] memory) {
        return userReminders[user];
    }

    function getRemindersFor(uint256 reminderId) external view returns (address[] memory) {
        return reminderAddresses[reminderId];
    }
}
