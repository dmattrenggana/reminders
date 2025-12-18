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

// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

/**
 * @title ReminderVaultV3
 * @dev Manages reminder commitments with social rewards + unclaimed reward withdrawal
 */
contract ReminderVaultV3 is ReentrancyGuard {
    IERC20 public commitToken;

    struct Reminder {
        address user;
        uint256 commitAmount;
        uint256 rewardPoolAmount;
        uint256 reminderTime;
        uint256 confirmationDeadline;
        bool confirmed;
        bool burned;
        string description;
        string farcasterUsername;
        uint256 totalReminders;
        uint256 rewardsClaimed;
        uint256 confirmationTime;
    }

    struct RemindClaim {
        address reminder;
        uint256 neynarScore;
        bool claimed;
    }

    mapping(uint256 => Reminder) public reminders;
    mapping(uint256 => mapping(address => RemindClaim)) public remindClaims;
    mapping(uint256 => address[]) public reminderAddresses;
    mapping(address => uint256[]) public userReminders;
    uint256 public nextReminderId;

    uint256 public constant CLAIM_WINDOW = 24 hours;

    event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 commitAmount, uint256 rewardPoolAmount, uint256 reminderTime, string description, string farcasterUsername);
    event UserReminded(uint256 indexed reminderId, address indexed remindedBy, uint256 neynarScore, uint256 timestamp);
    event RewardClaimed(uint256 indexed reminderId, address indexed claimer, uint256 amount);
    event ReminderConfirmed(uint256 indexed reminderId, address indexed user, uint256 timestamp);
    event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 commitAmount);
    event RewardPoolReturned(uint256 indexed reminderId, address indexed user, uint256 rewardPoolAmount);
    event UnclaimedRewardsWithdrawn(uint256 indexed reminderId, address indexed user, uint256 amount);

    constructor(address _commitToken) {
        commitToken = IERC20(_commitToken);
    }

    function createReminder(uint256 totalAmount, uint256 reminderTime, string memory description, string memory farcasterUsername) external nonReentrant returns (uint256) {
        require(totalAmount > 0 && totalAmount % 2 == 0, "Amount must be even and > 0");
        require(reminderTime > block.timestamp, "Reminder time must be in future");
        require(bytes(description).length > 0, "Description required");
        require(bytes(farcasterUsername).length > 0, "Farcaster username required");
        require(commitToken.transferFrom(msg.sender, address(this), totalAmount), "Token transfer failed");

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
            rewardsClaimed: 0,
            confirmationTime: 0
        });

        userReminders[msg.sender].push(reminderId);
        emit ReminderCreated(reminderId, msg.sender, commitAmount, rewardPoolAmount, reminderTime, description, farcasterUsername);
        return reminderId;
    }

    function recordReminder(uint256 reminderId, uint256 neynarScore) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.user != address(0), "Reminder does not exist");
        require(reminder.user != msg.sender, "Cannot remind yourself");
        require(!reminder.confirmed && !reminder.burned, "Reminder already resolved");
        require(block.timestamp >= reminder.reminderTime - 1 hours, "Too early to remind");
        require(block.timestamp <= reminder.confirmationDeadline, "Reminder expired");
        require(!remindClaims[reminderId][msg.sender].claimed, "Already reminded");
        require(neynarScore > 0, "Invalid Neynar score");

        uint256 currentTotalScore = _getTotalNeynarScore(reminderId) + neynarScore;
        uint256 userReward = (reminder.rewardPoolAmount * neynarScore) / currentTotalScore;
        
        remindClaims[reminderId][msg.sender] = RemindClaim({reminder: msg.sender, neynarScore: neynarScore, claimed: true});
        reminderAddresses[reminderId].push(msg.sender);
        reminder.totalReminders++;
        reminder.rewardsClaimed += userReward;

        require(commitToken.transfer(msg.sender, userReward), "Reward transfer failed");
        emit UserReminded(reminderId, msg.sender, neynarScore, block.timestamp);
        emit RewardClaimed(reminderId, msg.sender, userReward);
    }

    function claimReward(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        RemindClaim storage claim = remindClaims[reminderId][msg.sender];
        require(claim.reminder == msg.sender, "No reminder record");
        require(!claim.claimed, "Already claimed");
        require(reminder.confirmed, "Reminder not confirmed yet");
        require(reminder.rewardPoolAmount > reminder.rewardsClaimed, "No rewards left");

        uint256 totalScore = _getTotalNeynarScore(reminderId);
        uint256 userReward = (reminder.rewardPoolAmount * claim.neynarScore) / totalScore;
        claim.claimed = true;
        reminder.rewardsClaimed += userReward;

        require(commitToken.transfer(msg.sender, userReward), "Reward transfer failed");
        emit RewardClaimed(reminderId, msg.sender, userReward);
    }

    function confirmReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.user == msg.sender, "Not reminder owner");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Tokens already burned");
        
        uint256 notificationStartTime = reminder.reminderTime - 1 hours;
        require(block.timestamp >= notificationStartTime, "Too early to confirm");
        require(block.timestamp <= reminder.confirmationDeadline, "Confirmation deadline passed");

        reminder.confirmed = true;
        reminder.confirmationTime = block.timestamp;

        if (reminder.totalReminders == 0) {
            uint256 totalReturn = reminder.commitAmount + reminder.rewardPoolAmount;
            reminder.rewardsClaimed = reminder.rewardPoolAmount;
            require(commitToken.transfer(msg.sender, totalReturn), "Token return failed");
            emit ReminderConfirmed(reminderId, msg.sender, block.timestamp);
            emit UnclaimedRewardsWithdrawn(reminderId, msg.sender, reminder.rewardPoolAmount);
        } else {
            require(commitToken.transfer(msg.sender, reminder.commitAmount), "Commit token return failed");
            emit ReminderConfirmed(reminderId, msg.sender, block.timestamp);
        }
    }

    function withdrawUnclaimedRewards(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(reminder.user == msg.sender, "Not reminder owner");
        require(reminder.confirmed, "Reminder not confirmed");
        require(reminder.confirmationTime > 0, "Invalid confirmation time");
        require(block.timestamp >= reminder.confirmationTime + CLAIM_WINDOW, "Claim window not expired yet");

        uint256 unclaimedAmount = reminder.rewardPoolAmount - reminder.rewardsClaimed;
        require(unclaimedAmount > 0, "No unclaimed rewards");
        reminder.rewardsClaimed = reminder.rewardPoolAmount;

        require(commitToken.transfer(msg.sender, unclaimedAmount), "Unclaimed reward transfer failed");
        emit UnclaimedRewardsWithdrawn(reminderId, msg.sender, unclaimedAmount);
    }

    function burnMissedReminder(uint256 reminderId) external nonReentrant {
        Reminder storage reminder = reminders[reminderId];
        require(!reminder.confirmed, "Reminder was confirmed");
        require(!reminder.burned, "Already burned");
        require(block.timestamp > reminder.confirmationDeadline, "Deadline not passed yet");

        reminder.burned = true;
        require(commitToken.transfer(address(0xdead), reminder.commitAmount), "Token burn failed");
        require(commitToken.transfer(reminder.user, reminder.rewardPoolAmount), "Reward pool return failed");

        emit TokensBurned(reminderId, reminder.user, reminder.commitAmount);
        emit RewardPoolReturned(reminderId, reminder.user, reminder.rewardPoolAmount);
    }

    function _getTotalNeynarScore(uint256 reminderId) private view returns (uint256) {
        uint256 total = 0;
        address[] memory remindersFor = reminderAddresses[reminderId];
        for (uint256 i = 0; i < remindersFor.length; i++) {
            total += remindClaims[reminderId][remindersFor[i]].neynarScore;
        }
        return total;
    }

    function getActiveReminders() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextReminderId; i++) {
            Reminder memory reminder = reminders[i];
            if (!reminder.confirmed && !reminder.burned && block.timestamp < reminder.confirmationDeadline) {
                count++;
            }
        }
        
        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextReminderId; i++) {
            Reminder memory reminder = reminders[i];
            if (!reminder.confirmed && !reminder.burned && block.timestamp < reminder.confirmationDeadline) {
                activeIds[index] = i;
                index++;
            }
        }
        return activeIds;
    }

    function canRemind(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        return block.timestamp >= reminder.reminderTime - 1 hours && block.timestamp <= reminder.confirmationDeadline && !reminder.confirmed && !reminder.burned;
    }

    function canWithdrawUnclaimed(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        if (!reminder.confirmed || reminder.confirmationTime == 0) return false;
        if (block.timestamp < reminder.confirmationTime + CLAIM_WINDOW) return false;
        uint256 unclaimedAmount = reminder.rewardPoolAmount - reminder.rewardsClaimed;
        return unclaimedAmount > 0;
    }

    function getUnclaimedAmount(uint256 reminderId) external view returns (uint256) {
        Reminder memory reminder = reminders[reminderId];
        if (reminder.rewardPoolAmount <= reminder.rewardsClaimed) return 0;
        return reminder.rewardPoolAmount - reminder.rewardsClaimed;
    }
    
    function getUserReminders(address user) external view returns (uint256[] memory) {
        return userReminders[user];
    }

    function getRemindersFor(uint256 reminderId) external view returns (address[] memory) {
        return reminderAddresses[reminderId];
    }
}
