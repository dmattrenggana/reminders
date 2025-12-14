// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// OpenZeppelin Contracts (last updated v5.0.0) (utils/ReentrancyGuard.sol)
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _checkNotEntered();
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    function _checkNotEntered() private view {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

contract ReminderVaultV2 is ReentrancyGuard {
    IERC20 public commitToken;
    
    struct Reminder {
        address user;
        uint256 totalAmount;
        uint256 commitAmount;
        uint256 rewardPoolAmount;
        uint256 reminderTime;
        uint256 confirmationDeadline;
        string description;
        bool confirmed;
        bool burned;
        string farcasterUsername;
        address[] reminders;
        mapping(address => bool) hasReminded;
        mapping(address => bool) rewardsClaimed;
    }
    
    mapping(uint256 => Reminder) public reminders;
    uint256 public nextReminderId;
    
    event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 totalAmount, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, string farcasterUsername);
    event ReminderConfirmed(uint256 indexed reminderId);
    event ReminderBurned(uint256 indexed reminderId, uint256 commitAmountBurned, uint256 rewardPoolReturned);
    event UserReminded(uint256 indexed reminderId, address indexed reminder, uint256 neynarScore);
    event RewardClaimed(uint256 indexed reminderId, address indexed reminder, uint256 amount);
    
    constructor(address _commitToken) {
        commitToken = IERC20(_commitToken);
    }
    
    function createReminder(
        uint256 amount,
        uint256 reminderTime,
        string memory description,
        string memory farcasterUsername
    ) external nonReentrant returns (uint256) {
        require(amount > 0 && amount % 2 == 0, "Amount must be positive and even");
        require(reminderTime > block.timestamp, "Reminder time must be in future");
        require(bytes(description).length > 0, "Description required");
        
        uint256 commitAmount = amount / 2;
        uint256 rewardPoolAmount = amount / 2;
        
        require(
            commitToken.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        uint256 reminderId = nextReminderId++;
        Reminder storage reminder = reminders[reminderId];
        reminder.user = msg.sender;
        reminder.totalAmount = amount;
        reminder.commitAmount = commitAmount;
        reminder.rewardPoolAmount = rewardPoolAmount;
        reminder.reminderTime = reminderTime;
        reminder.confirmationDeadline = reminderTime + 1 hours;
        reminder.description = description;
        reminder.confirmed = false;
        reminder.burned = false;
        reminder.farcasterUsername = farcasterUsername;
        
        emit ReminderCreated(
            reminderId,
            msg.sender,
            amount,
            commitAmount,
            rewardPoolAmount,
            reminderTime,
            farcasterUsername
        );
        
        return reminderId;
    }
    
    function confirmReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.user == msg.sender, "Not reminder owner");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(block.timestamp >= reminder.reminderTime, "Too early to confirm");
        require(block.timestamp <= reminder.confirmationDeadline, "Confirmation deadline passed");
        
        reminder.confirmed = true;
        
        uint256 returnAmount = reminder.commitAmount;
        if (reminder.reminders.length == 0) {
            returnAmount += reminder.rewardPoolAmount;
        }
        
        require(
            commitToken.transfer(msg.sender, returnAmount),
            "Token transfer failed"
        );
        
        emit ReminderConfirmed(reminderId);
    }
    
    function recordReminder(uint256 reminderId, uint256 neynarScore) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(msg.sender != reminder.user, "Cannot remind yourself");
        require(!reminder.hasReminded[msg.sender], "Already reminded");
        require(canRemind(reminderId), "Not in remind window");
        
        reminder.hasReminded[msg.sender] = true;
        reminder.reminders.push(msg.sender);
        
        emit UserReminded(reminderId, msg.sender, neynarScore);
    }
    
    function canRemind(uint256 reminderId) public view returns (bool) {
        Reminder storage reminder = reminders[reminderId];
        if (reminder.confirmed || reminder.burned) return false;
        uint256 remindWindow = reminder.reminderTime - 1 hours;
        return block.timestamp >= remindWindow && block.timestamp < reminder.confirmationDeadline;
    }
    
    function calculateReward(uint256 reminderId, address reminder) public view returns (uint256) {
        Reminder storage rem = reminders[reminderId];
        
        if (!rem.confirmed || rem.reminders.length == 0) return 0;
        if (!rem.hasReminded[reminder]) return 0;
        if (rem.rewardsClaimed[reminder]) return 0;
        
        uint256 totalScore = _getTotalNeynarScore(reminderId);
        if (totalScore == 0) return 0;
        
        uint256 reminderScore = 1;
        uint256 rewardShare = (rem.rewardPoolAmount * reminderScore) / totalScore;
        
        return rewardShare;
    }
    
    function claimReward(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.confirmed, "Reminder not confirmed");
        require(reminder.hasReminded[msg.sender], "Did not remind");
        require(!reminder.rewardsClaimed[msg.sender], "Already claimed");
        
        uint256 reward = calculateReward(reminderId, msg.sender);
        require(reward > 0, "No reward available");
        
        reminder.rewardsClaimed[msg.sender] = true;
        
        require(
            commitToken.transfer(msg.sender, reward),
            "Token transfer failed"
        );
        
        emit RewardClaimed(reminderId, msg.sender, reward);
    }
    
    function burnMissedReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(block.timestamp > reminder.confirmationDeadline, "Deadline not passed");
        
        reminder.burned = true;
        
        address deadAddress = 0x000000000000000000000000000000000000dEaD;
        require(
            commitToken.transfer(deadAddress, reminder.commitAmount),
            "Burn transfer failed"
        );
        
        uint256 rewardPoolReturn = reminder.rewardPoolAmount;
        require(
            commitToken.transfer(reminder.user, rewardPoolReturn),
            "Reward return failed"
        );
        
        emit ReminderBurned(reminderId, reminder.commitAmount, rewardPoolReturn);
    }
    
    function getActiveReminders() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextReminderId; i++) {
            if (canRemind(i)) count++;
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextReminderId; i++) {
            if (canRemind(i)) {
                active[index++] = i;
            }
        }
        
        return active;
    }
    
    function getReminderDetails(uint256 reminderId) external view returns (
        address user,
        uint256 totalAmount,
        uint256 commitAmount,
        uint256 rewardPoolAmount,
        uint256 reminderTime,
        uint256 confirmationDeadline,
        string memory description,
        bool confirmed,
        bool burned,
        string memory farcasterUsername,
        uint256 reminderCount
    ) {
        Reminder storage reminder = reminders[reminderId];
        return (
            reminder.user,
            reminder.totalAmount,
            reminder.commitAmount,
            reminder.rewardPoolAmount,
            reminder.reminderTime,
            reminder.confirmationDeadline,
            reminder.description,
            reminder.confirmed,
            reminder.burned,
            reminder.farcasterUsername,
            reminder.reminders.length
        );
    }
    
    function _getTotalNeynarScore(uint256 reminderId) internal view returns (uint256) {
        Reminder storage reminder = reminders[reminderId];
        return reminder.reminders.length;
    }
    
    function totalReminders() external view returns (uint256) {
        return nextReminderId;
    }
    
    function getRemindersForUser(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextReminderId; i++) {
            if (reminders[i].user == user) count++;
        }
        
        uint256[] memory userReminders = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextReminderId; i++) {
            if (reminders[i].user == user) {
                userReminders[index++] = i;
            }
        }
        
        return userReminders;
    }
}
