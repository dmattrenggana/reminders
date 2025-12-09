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
        uint256 tokenAmount;
        uint256 reminderTime;
        uint256 confirmationDeadline; // 1 hour after reminder time
        bool confirmed;
        bool burned;
        string description;
    }

    mapping(uint256 => Reminder) public reminders;
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

        // Transfer tokens to contract
        require(
            commitToken.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );

        uint256 reminderId = nextReminderId++;
        
        // Confirmation deadline is 1 hour after reminder time
        uint256 confirmationDeadline = reminderTime + 1 hours;

        reminders[reminderId] = Reminder({
            user: msg.sender,
            tokenAmount: tokenAmount,
            reminderTime: reminderTime,
            confirmationDeadline: confirmationDeadline,
            confirmed: false,
            burned: false,
            description: description
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
        
        // Can confirm starting from 1 hour before reminder time
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

        // Return tokens to user
        require(
            commitToken.transfer(msg.sender, reminder.tokenAmount),
            "Token return failed"
        );

        emit ReminderConfirmed(reminderId, msg.sender, block.timestamp);
        emit TokensReclaimed(reminderId, msg.sender, reminder.tokenAmount);
    }

    /**
     * @dev Burn tokens for missed reminder (callable by anyone after deadline)
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

        // Burn the tokens (send to dead address)
        require(
            commitToken.transfer(address(0xdead), reminder.tokenAmount),
            "Token burn failed"
        );

        emit TokensBurned(reminderId, reminder.user, reminder.tokenAmount);
    }

    /**
     * @dev Get all reminder IDs for a user
     */
    function getUserReminders(address user) external view returns (uint256[] memory) {
        return userReminders[user];
    }

    /**
     * @dev Get reminder details
     */
    function getReminder(uint256 reminderId) external view returns (
        address user,
        uint256 tokenAmount,
        uint256 reminderTime,
        uint256 confirmationDeadline,
        bool confirmed,
        bool burned,
        string memory description
    ) {
        Reminder memory reminder = reminders[reminderId];
        return (
            reminder.user,
            reminder.tokenAmount,
            reminder.reminderTime,
            reminder.confirmationDeadline,
            reminder.confirmed,
            reminder.burned,
            reminder.description
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
}
