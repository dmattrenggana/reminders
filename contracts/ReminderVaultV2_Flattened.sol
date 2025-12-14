// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin IERC20 Interface
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

// OpenZeppelin ReentrancyGuard
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _checkReentrancyGuard();
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    function _checkReentrancyGuard() private view {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
    }
}

contract ReminderVaultV2 is ReentrancyGuard {
    IERC20 public commitToken;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    struct Reminder {
        address user;
        uint256 amount;
        uint256 commitAmount;
        uint256 rewardPoolAmount;
        uint256 confirmationDeadline;
        bool confirmed;
        bool burned;
        address[] reminders;
        mapping(address => uint256) neynarScores;
        mapping(address => bool) rewardsClaimed;
    }
    
    mapping(uint256 => Reminder) public reminders;
    uint256 public reminderCount;
    
    event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 amount, uint256 deadline);
    event ReminderConfirmed(uint256 indexed reminderId, address indexed user);
    event ReminderBurned(uint256 indexed reminderId, uint256 burnedAmount, uint256 returnedAmount);
    event UserReminded(uint256 indexed reminderId, address indexed reminder, uint256 neynarScore);
    event RewardClaimed(uint256 indexed reminderId, address indexed reminder, uint256 amount);
    
    constructor(address _commitToken) {
        commitToken = IERC20(_commitToken);
    }
    
    function createReminder(uint256 _amount, uint256 _confirmationDeadline) external nonReentrant returns (uint256) {
        require(_amount > 0 && _amount % 2 == 0, "Amount must be positive and even");
        require(_confirmationDeadline > block.timestamp, "Deadline must be in future");
        
        require(
            commitToken.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );
        
        uint256 reminderId = reminderCount++;
        Reminder storage reminder = reminders[reminderId];
        
        reminder.user = msg.sender;
        reminder.amount = _amount;
        reminder.commitAmount = _amount / 2;
        reminder.rewardPoolAmount = _amount / 2;
        reminder.confirmationDeadline = _confirmationDeadline;
        reminder.confirmed = false;
        reminder.burned = false;
        
        emit ReminderCreated(reminderId, msg.sender, _amount, _confirmationDeadline);
        return reminderId;
    }
    
    function confirmReminder(uint256 _reminderId) external nonReentrant {
        Reminder storage reminder = reminders[_reminderId];
        require(reminder.user == msg.sender, "Not reminder owner");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(block.timestamp <= reminder.confirmationDeadline, "Deadline passed");
        
        reminder.confirmed = true;
        
        require(
            commitToken.transfer(msg.sender, reminder.commitAmount),
            "Token transfer failed"
        );
        
        emit ReminderConfirmed(_reminderId, msg.sender);
    }
    
    function recordReminder(uint256 _reminderId, uint256 _neynarScore) external {
        Reminder storage reminder = reminders[_reminderId];
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(block.timestamp <= reminder.confirmationDeadline, "Deadline passed");
        require(block.timestamp >= reminder.confirmationDeadline - 1 hours, "Too early to remind");
        
        bool alreadyReminded = false;
        for (uint256 i = 0; i < reminder.reminders.length; i++) {
            if (reminder.reminders[i] == msg.sender) {
                alreadyReminded = true;
                break;
            }
        }
        require(!alreadyReminded, "Already reminded");
        
        reminder.reminders.push(msg.sender);
        reminder.neynarScores[msg.sender] = _neynarScore;
        
        emit UserReminded(_reminderId, msg.sender, _neynarScore);
    }
    
    function burnMissedReminder(uint256 _reminderId) external nonReentrant {
        Reminder storage reminder = reminders[_reminderId];
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(block.timestamp > reminder.confirmationDeadline, "Deadline not passed");
        
        reminder.burned = true;
        
        require(
            commitToken.transfer(BURN_ADDRESS, reminder.commitAmount),
            "Burn transfer failed"
        );
        
        uint256 returnAmount = reminder.rewardPoolAmount;
        for (uint256 i = 0; i < reminder.reminders.length; i++) {
            address reminderAddr = reminder.reminders[i];
            if (!reminder.rewardsClaimed[reminderAddr]) {
                uint256 reward = calculateReward(_reminderId, reminderAddr);
                returnAmount -= reward;
            }
        }
        
        if (returnAmount > 0) {
            require(
                commitToken.transfer(reminder.user, returnAmount),
                "Return transfer failed"
            );
        }
        
        emit ReminderBurned(_reminderId, reminder.commitAmount, returnAmount);
    }
    
    function calculateReward(uint256 _reminderId, address _reminder) public view returns (uint256) {
        Reminder storage reminder = reminders[_reminderId];
        
        bool isReminder = false;
        for (uint256 i = 0; i < reminder.reminders.length; i++) {
            if (reminder.reminders[i] == _reminder) {
                isReminder = true;
                break;
            }
        }
        if (!isReminder) return 0;
        
        uint256 totalScore = _getTotalNeynarScore(_reminderId);
        if (totalScore == 0) return 0;
        
        uint256 userScore = reminder.neynarScores[_reminder];
        return (reminder.rewardPoolAmount * userScore) / totalScore;
    }
    
    function claimReward(uint256 _reminderId) external nonReentrant {
        Reminder storage reminder = reminders[_reminderId];
        require(reminder.burned || reminder.confirmed, "Reminder not finalized");
        require(!reminder.rewardsClaimed[msg.sender], "Reward already claimed");
        
        uint256 reward = calculateReward(_reminderId, msg.sender);
        require(reward > 0, "No reward to claim");
        
        reminder.rewardsClaimed[msg.sender] = true;
        
        require(
            commitToken.transfer(msg.sender, reward),
            "Reward transfer failed"
        );
        
        emit RewardClaimed(_reminderId, msg.sender, reward);
    }
    
    function _getTotalNeynarScore(uint256 _reminderId) internal view returns (uint256) {
        Reminder storage reminder = reminders[_reminderId];
        uint256 total = 0;
        for (uint256 i = 0; i < reminder.reminders.length; i++) {
            total += reminder.neynarScores[reminder.reminders[i]];
        }
        return total;
    }
    
    function canRemind(uint256 _reminderId) external view returns (bool) {
        Reminder storage reminder = reminders[_reminderId];
        if (reminder.confirmed || reminder.burned) return false;
        if (block.timestamp > reminder.confirmationDeadline) return false;
        if (block.timestamp < reminder.confirmationDeadline - 1 hours) return false;
        return true;
    }
    
    function getActiveReminders() external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](reminderCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < reminderCount; i++) {
            Reminder storage reminder = reminders[i];
            if (!reminder.confirmed && !reminder.burned && 
                block.timestamp <= reminder.confirmationDeadline &&
                block.timestamp >= reminder.confirmationDeadline - 1 hours) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        return result;
    }
    
    function getReminderDetails(uint256 _reminderId) external view returns (
        address user,
        uint256 amount,
        uint256 commitAmount,
        uint256 rewardPoolAmount,
        uint256 deadline,
        bool confirmed,
        bool burned,
        address[] memory remindersList
    ) {
        Reminder storage reminder = reminders[_reminderId];
        return (
            reminder.user,
            reminder.amount,
            reminder.commitAmount,
            reminder.rewardPoolAmount,
            reminder.confirmationDeadline,
            reminder.confirmed,
            reminder.burned,
            reminder.reminders
        );
    }
    
    function totalReminders() external view returns (uint256) {
        return reminderCount;
    }
}
