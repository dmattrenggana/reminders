// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReminderVaultV4
 * @dev Manages reminder commitments with 30/70 split and fixed tier rewards
 * 
 * Token Split:
 * - 30% commitment (returned on confirm, burned if missed)
 * - 70% reward pool (distributed to helpers based on Neynar score tiers)
 * 
 * Helper Reward Tiers (based on Neynar score):
 * - ≥ 0.9: 10% of reward pool
 * - 0.5 - 0.89: 6% of reward pool
 * - < 0.5: 3% of reward pool
 * 
 * Reclaim Mechanism:
 * - Creator can reclaim at T-1 hour (1 hour before deadline)
 * - Returns 30% commitment + unclaimed portion of 70% reward pool
 * - If deadline passed, cron job burns 30% and returns unclaimed 70%
 */
contract ReminderVaultV4 is ReentrancyGuard {
    IERC20 public commitToken;

    struct Reminder {
        address user;
        uint256 commitAmount;        // 30% of total
        uint256 rewardPoolAmount;     // 70% of total
        uint256 reminderTime;          // Deadline timestamp
        uint256 confirmationDeadline; // reminderTime + 1 hour
        bool confirmed;
        bool burned;
        string description;
        string farcasterUsername;
        uint256 totalReminders;       // Count of helpers
        uint256 rewardsClaimed;       // Total rewards claimed by helpers
        uint256 confirmationTime;
    }

    struct HelperRecord {
        address helper;
        uint256 neynarScore;          // Score * 100 (0-100 scale)
        bool claimed;
        uint256 rewardAmount;         // Calculated reward based on tier
    }

    // Reward tier constants (in basis points, 10000 = 100%)
    uint256 public constant TIER_HIGH = 1000;      // 10% for score ≥ 0.9
    uint256 public constant TIER_MEDIUM = 600;     // 6% for score 0.5-0.89
    uint256 public constant TIER_LOW = 300;        // 3% for score < 0.5

    mapping(uint256 => Reminder) public reminders;
    mapping(uint256 => mapping(address => HelperRecord)) public helperRecords;
    mapping(uint256 => address[]) public helperAddresses;
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

    event ReminderReclaimed(
        uint256 indexed reminderId,
        address indexed user,
        uint256 commitAmount,
        uint256 unclaimedRewards
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
     * @dev Create a new reminder with 30/70 split
     * @param totalAmount Total tokens to lock
     * @param reminderTime Unix timestamp when reminder should trigger
     * @param description Description of the reminder
     * @param farcasterUsername Farcaster username of creator
     */
    function createReminder(
        uint256 totalAmount,
        uint256 reminderTime,
        string memory description,
        string memory farcasterUsername
        ) external nonReentrant returns (uint256) {
        require(totalAmount > 0, "Amount must be greater than 0");
        require(reminderTime > block.timestamp, "Reminder time must be in future");
        require(bytes(description).length > 0, "Description required");
        require(bytes(farcasterUsername).length > 0, "Farcaster username required");

        require(
            commitToken.transferFrom(msg.sender, address(this), totalAmount),
            "Token transfer failed"
        );

        uint256 reminderId = nextReminderId++;
        
        // 30/70 split
        uint256 commitAmount = (totalAmount * 30) / 100;
        uint256 rewardPoolAmount = totalAmount - commitAmount; // 70%
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
            rewardsClaimed: 0,
            confirmationTime: 0
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
     * @dev Record helper reminder with Neynar score
     * @param reminderId ID of the reminder
     * @param neynarScore Neynar score (0-100, representing 0.0-1.0)
     */
    function recordReminder(
        uint256 reminderId,
        uint256 neynarScore
    ) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.user != address(0), "Reminder does not exist");
        require(reminder.user != msg.sender, "Cannot remind yourself");
        require(!reminder.confirmed && !reminder.burned, "Reminder already resolved");
        
        // Can only help at T-1 hour (1 hour before deadline)
        require(
            block.timestamp >= reminder.reminderTime - 1 hours,
            "Too early to remind"
        );
        require(
            block.timestamp <= reminder.confirmationDeadline,
            "Reminder expired"
        );
        
        require(
            helperRecords[reminderId][msg.sender].helper == address(0),
            "Already helped this reminder"
        );
        require(neynarScore <= 100, "Invalid Neynar score (max 100)");

        // Calculate reward based on tier
        uint256 rewardPercentage;
        if (neynarScore >= 90) {
            rewardPercentage = TIER_HIGH; // 10%
        } else if (neynarScore >= 50) {
            rewardPercentage = TIER_MEDIUM; // 6%
        } else {
            rewardPercentage = TIER_LOW; // 3%
        }

        uint256 rewardAmount = (reminder.rewardPoolAmount * rewardPercentage) / 10000;

        // Record helper
        helperRecords[reminderId][msg.sender] = HelperRecord({
            helper: msg.sender,
            neynarScore: neynarScore,
            claimed: false,
            rewardAmount: rewardAmount
        });

        helperAddresses[reminderId].push(msg.sender);
        reminder.totalReminders++;

        emit UserReminded(reminderId, msg.sender, neynarScore, block.timestamp);
    }

    /**
     * @dev Claim reward for helper
     * @param reminderId ID of the reminder
     */
    function claimReward(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        HelperRecord storage record = helperRecords[reminderId][msg.sender];

        require(record.helper == msg.sender, "No reminder record");
        require(!record.claimed, "Already claimed");
        require(reminder.confirmed || block.timestamp > reminder.confirmationDeadline, 
            "Cannot claim yet");

        // Check if reward pool has enough
        require(
            reminder.rewardPoolAmount >= reminder.rewardsClaimed + record.rewardAmount,
            "Insufficient reward pool"
        );

        record.claimed = true;
        reminder.rewardsClaimed += record.rewardAmount;

        require(
            commitToken.transfer(msg.sender, record.rewardAmount),
            "Reward transfer failed"
        );

        emit RewardClaimed(reminderId, msg.sender, record.rewardAmount);
    }

    /**
     * @dev Confirm reminder completion
     * Returns 30% commitment to creator
     */
    function confirmReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        
        require(reminder.user == msg.sender, "Not reminder owner");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Tokens already burned");
        
        // Can confirm from T-1 hour until deadline + 1 hour
        require(
            block.timestamp >= reminder.reminderTime - 1 hours,
            "Too early to confirm"
        );
        require(
            block.timestamp <= reminder.confirmationDeadline,
            "Confirmation deadline passed"
        );

        reminder.confirmed = true;
        reminder.confirmationTime = block.timestamp;

        // Return 30% commitment
        require(
            commitToken.transfer(msg.sender, reminder.commitAmount),
            "Commit token return failed"
        );

        emit ReminderConfirmed(reminderId, msg.sender, block.timestamp);
    }

    /**
     * @dev Reclaim tokens at T-1 hour
     * Returns 30% commitment + unclaimed portion of 70% reward pool
     * Can only be called 1 hour before deadline
     */
    function reclaimReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        
        require(reminder.user == msg.sender, "Not reminder owner");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Tokens already burned");
        
        // Can only reclaim at T-1 hour (exactly 1 hour before deadline)
        require(
            block.timestamp >= reminder.reminderTime - 1 hours,
            "Too early to reclaim"
        );
        require(
            block.timestamp < reminder.reminderTime,
            "Deadline passed, use burnMissedReminder instead"
        );

        uint256 unclaimedRewards = reminder.rewardPoolAmount - reminder.rewardsClaimed;
        uint256 totalReturn = reminder.commitAmount + unclaimedRewards;

        reminder.burned = true; // Mark as resolved

        require(
            commitToken.transfer(msg.sender, totalReturn),
            "Reclaim transfer failed"
        );

        emit ReminderReclaimed(reminderId, msg.sender, reminder.commitAmount, unclaimedRewards);
    }

    /**
     * @dev Burn missed reminder (called by cron job after deadline)
     * Burns 30% commitment, returns unclaimed 70% reward pool
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

        // Burn 30% commitment
        require(
            commitToken.transfer(address(0xdead), reminder.commitAmount),
            "Token burn failed"
        );

        // Return unclaimed 70% reward pool
        uint256 unclaimedRewards = reminder.rewardPoolAmount - reminder.rewardsClaimed;
        if (unclaimedRewards > 0) {
            require(
                commitToken.transfer(reminder.user, unclaimedRewards),
                "Reward pool return failed"
            );
            emit RewardPoolReturned(reminderId, reminder.user, unclaimedRewards);
        }

        emit TokensBurned(reminderId, reminder.user, reminder.commitAmount);
    }

    /**
     * @dev Get list of helpers for a reminder
     */
    function getHelpersFor(uint256 reminderId) external view returns (address[] memory) {
        return helperAddresses[reminderId];
    }

    /**
     * @dev Get user's reminder IDs
     */
    function getUserReminders(address user) external view returns (uint256[] memory) {
        return userReminders[user];
    }

    /**
     * @dev Check if reminder can be helped (T-1 hour window)
     */
    function canRemind(uint256 reminderId) external view returns (bool) {
        Reminder storage reminder = reminders[reminderId];
        if (reminder.user == address(0)) return false;
        if (reminder.confirmed || reminder.burned) return false;
        
        uint256 now_ = block.timestamp;
        return now_ >= reminder.reminderTime - 1 hours && 
               now_ <= reminder.confirmationDeadline;
    }

    /**
     * @dev Get active reminders (not confirmed, not burned)
     */
    function getActiveReminders() external view returns (uint256[] memory) {
        uint256[] memory active = new uint256[](nextReminderId);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextReminderId; i++) {
            if (!reminders[i].confirmed && !reminders[i].burned) {
                active[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active[i];
        }
        
        return result;
    }
}
