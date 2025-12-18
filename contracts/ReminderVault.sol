// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReminderVault
 * @dev Manages reminder commitments with token locking and burning
 */
contract ReminderVault is ReentrancyGuard {
    IERC20 public commitToken;

    struct Reminder {
        address user;
        uint256 commitmentAmount; // renamed from tokenAmount to match V2 ABI
        uint256 rewardPoolAmount; // added reward pool for social reminders
        uint256 reminderTime;
        uint256 confirmationDeadline;
        bool confirmed;
        bool burned;
        string description;
        uint256 totalReminders; // added to track how many people reminded
    }

    struct ReminderRecord {
        address[] remindedBy;
        uint256[] scores;
        bool[] claimed;
    }

    mapping(uint256 => Reminder) public reminders;
    mapping(uint256 => ReminderRecord) public reminderRecords;
    mapping(address => uint256[]) public userReminders;
    uint256 public nextReminderId;

    event ReminderCreated(
        uint256 indexed reminderId,
        address indexed user,
        uint256 tokenAmount,
        uint256 reminderTime,
        string description
    );

    event ReminderConfirmed(
        uint256 indexed reminderId,
        address indexed user,
        uint256 timestamp
    );

    event TokensBurned(
        uint256 indexed reminderId,
        address indexed user,
        uint256 tokenAmount
    );

    event TokensReclaimed(
        uint256 indexed reminderId,
        address indexed user,
        uint256 tokenAmount
    );

    constructor(address _commitToken) {
        commitToken = IERC20(_commitToken);
    }

    /**
     * @dev Create a new reminder with token commitment
     * @param tokenAmount Amount of tokens to lock
     * @param reminderTime Unix timestamp when reminder should trigger
     * @param description Description of the reminder
     */
    function createReminder(
        uint256 tokenAmount,
        uint256 reminderTime,
        string memory description
    ) external nonReentrant returns (uint256) {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(reminderTime > block.timestamp, "Reminder time must be in future");
        require(bytes(description).length > 0, "Description required");

        require(
            commitToken.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );

        uint256 reminderId = nextReminderId++;
        uint256 confirmationDeadline = reminderTime + 1 hours;

        uint256 commitmentAmount = tokenAmount / 2; // 50% commitment
        uint256 rewardPoolAmount = tokenAmount - commitmentAmount; // 50% reward pool

        reminders[reminderId] = Reminder({
            user: msg.sender,
            commitmentAmount: commitmentAmount,
            rewardPoolAmount: rewardPoolAmount,
            reminderTime: reminderTime,
            confirmationDeadline: confirmationDeadline,
            confirmed: false,
            burned: false,
            description: description,
            totalReminders: 0
        });

        userReminders[msg.sender].push(reminderId);

        emit ReminderCreated(
            reminderId,
            msg.sender,
            tokenAmount,
            reminderTime,
            description
        );

        return reminderId;
    }

    /**
     * @dev Confirm a reminder (must be after notification starts)
     * Notifications start 1 hour before reminderTime
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

        uint256 totalReturn = reminder.commitmentAmount + reminder.rewardPoolAmount;
        require(
            commitToken.transfer(msg.sender, totalReturn),
            "Token return failed"
        );

        emit ReminderConfirmed(reminderId, msg.sender, block.timestamp);
        emit TokensReclaimed(reminderId, msg.sender, totalReturn);
    }

    /**
     * @dev Burn tokens for missed reminder and return unclaimed reward pool
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

        require(
            commitToken.transfer(address(0xdead), reminder.commitmentAmount),
            "Token burn failed"
        );

        if (reminder.rewardPoolAmount > 0) {
            require(
                commitToken.transfer(reminder.user, reminder.rewardPoolAmount),
                "Reward pool return failed"
            );
        }

        emit TokensBurned(reminderId, reminder.user, reminder.commitmentAmount);
    }

    /**
     * @dev Get all reminder IDs for a user
     */
    function getUserReminders(address user) external view returns (uint256[] memory) {
        return userReminders[user];
    }

    /**
     * @dev Get reminder details (V2 format)
     */
    function getReminder(uint256 reminderId) external view returns (
        address user,
        uint256 commitmentAmount,
        uint256 rewardPoolAmount,
        uint256 reminderTime,
        uint256 confirmationDeadline,
        bool confirmed,
        bool burned,
        string memory description,
        uint256 totalReminders
    ) {
        Reminder memory reminder = reminders[reminderId];
        return (
            reminder.user,
            reminder.commitmentAmount,
            reminder.rewardPoolAmount,
            reminder.reminderTime,
            reminder.confirmationDeadline,
            reminder.confirmed,
            reminder.burned,
            reminder.description,
            reminder.totalReminders
        );
    }

    /**
     * @dev Check if reminder can be confirmed
     */
    function canConfirm(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        
        if (reminder.confirmed || reminder.burned) {
            return false;
        }

        uint256 notificationStartTime = reminder.reminderTime - 1 hours;
        
        return block.timestamp >= notificationStartTime && 
               block.timestamp <= reminder.confirmationDeadline;
    }

    /**
     * @dev Check if reminder tokens should be burned
     */
    function shouldBurn(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        
        return !reminder.confirmed && 
               !reminder.burned && 
               block.timestamp > reminder.confirmationDeadline;
    }

    function recordReminder(
        uint256 reminderId,
        address remindedBy,
        uint256 neynarScore
    ) external {
        require(reminders[reminderId].user == msg.sender, "Not reminder owner");
        require(!reminders[reminderId].confirmed, "Already confirmed");
        
        reminderRecords[reminderId].remindedBy.push(remindedBy);
        reminderRecords[reminderId].scores.push(neynarScore);
        reminderRecords[reminderId].claimed.push(false);
        
        reminders[reminderId].totalReminders++;
    }

    function getReminders(uint256 reminderId) external view returns (
        address[] memory remindedBy,
        uint256[] memory scores,
        bool[] memory claimed
    ) {
        ReminderRecord memory record = reminderRecords[reminderId];
        return (record.remindedBy, record.scores, record.claimed);
    }

    function calculateReward(uint256 reminderId, address claimer) external view returns (uint256) {
        Reminder memory reminder = reminders[reminderId];
        ReminderRecord memory record = reminderRecords[reminderId];
        
        if (!reminder.confirmed || reminder.totalReminders == 0) {
            return 0;
        }

        uint256 totalScore = 0;
        uint256 claimerScore = 0;
        
        for (uint256 i = 0; i < record.remindedBy.length; i++) {
            totalScore += record.scores[i];
            if (record.remindedBy[i] == claimer) {
                claimerScore = record.scores[i];
            }
        }

        if (claimerScore == 0 || totalScore == 0) {
            return 0;
        }

        return (reminder.rewardPoolAmount * claimerScore) / totalScore;
    }

    function claimReward(uint256 reminderId) external nonReentrant {
        Reminder memory reminder = reminders[reminderId];
        ReminderRecord storage record = reminderRecords[reminderId];
        
        require(reminder.confirmed, "Reminder not confirmed");
        
        for (uint256 i = 0; i < record.remindedBy.length; i++) {
            if (record.remindedBy[i] == msg.sender && !record.claimed[i]) {
                record.claimed[i] = true;
                
                uint256 reward = this.calculateReward(reminderId, msg.sender);
                if (reward > 0) {
                    require(
                        commitToken.transfer(msg.sender, reward),
                        "Reward transfer failed"
                    );
                }
                return;
            }
        }
        
        revert("No reward to claim");
    }

    function canClaimReward(uint256 reminderId, address claimer) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        ReminderRecord memory record = reminderRecords[reminderId];
        
        if (!reminder.confirmed) {
            return false;
        }
        
        for (uint256 i = 0; i < record.remindedBy.length; i++) {
            if (record.remindedBy[i] == claimer && !record.claimed[i]) {
                return true;
            }
        }
        
        return false;
    }
}
