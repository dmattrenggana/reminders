"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Info, Copy } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x9e4F3d07B469ECA25055366913cC3F6e158d0A08"

const VAULT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}

contract ReminderVault {
    IERC20 public immutable commitToken;
    uint256 private reminderCounter;
    
    struct Reminder {
        address user;
        uint256 tokenAmount;
        uint256 reminderTime;
        uint256 confirmationWindowStart;
        bool confirmed;
        bool burned;
        string description;
    }
    
    mapping(uint256 => Reminder) public reminders;
    mapping(address => uint256[]) public userReminders;
    
    event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 tokenAmount, uint256 reminderTime);
    event ReminderConfirmed(uint256 indexed reminderId, address indexed user);
    event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 amount);
    
    constructor(address _commitToken) {
        commitToken = IERC20(_commitToken);
    }
    
    function createReminder(
        uint256 tokenAmount,
        uint256 reminderTime,
        string memory description
    ) external returns (uint256) {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(reminderTime > block.timestamp, "Reminder time must be in the future");
        
        require(
            commitToken.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );
        
        reminderCounter++;
        uint256 reminderId = reminderCounter;
        uint256 confirmationWindowStart = reminderTime - 1 hours;
        
        reminders[reminderId] = Reminder({
            user: msg.sender,
            tokenAmount: tokenAmount,
            reminderTime: reminderTime,
            confirmationWindowStart: confirmationWindowStart,
            confirmed: false,
            burned: false,
            description: description
        });
        
        userReminders[msg.sender].push(reminderId);
        
        emit ReminderCreated(reminderId, msg.sender, tokenAmount, reminderTime);
        
        return reminderId;
    }
    
    function confirmReminder(uint256 reminderId) external {
        Reminder storage reminder = reminders[reminderId];
        
        require(reminder.user == msg.sender, "Not your reminder");
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(
            block.timestamp >= reminder.confirmationWindowStart,
            "Confirmation window not started"
        );
        require(
            block.timestamp <= reminder.reminderTime,
            "Confirmation window closed"
        );
        
        reminder.confirmed = true;
        
        require(
            commitToken.transfer(msg.sender, reminder.tokenAmount),
            "Token return failed"
        );
        
        emit ReminderConfirmed(reminderId, msg.sender);
    }
    
    function burnMissedReminder(uint256 reminderId) external {
        Reminder storage reminder = reminders[reminderId];
        
        require(!reminder.confirmed, "Already confirmed");
        require(!reminder.burned, "Already burned");
        require(
            block.timestamp > reminder.reminderTime,
            "Reminder time not passed"
        );
        
        reminder.burned = true;
        
        commitToken.burn(reminder.tokenAmount);
        
        emit TokensBurned(reminderId, reminder.user, reminder.tokenAmount);
    }
    
    function getUserReminders(address user) external view returns (uint256[] memory) {
        return userReminders[user];
    }
    
    function getReminder(uint256 reminderId) external view returns (
        address user,
        uint256 tokenAmount,
        uint256 reminderTime,
        uint256 confirmationWindowStart,
        bool confirmed,
        bool burned,
        string memory description
    ) {
        Reminder memory reminder = reminders[reminderId];
        return (
            reminder.user,
            reminder.tokenAmount,
            reminder.reminderTime,
            reminder.confirmationWindowStart,
            reminder.confirmed,
            reminder.burned,
            reminder.description
        );
    }
    
    function canConfirm(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        return (
            !reminder.confirmed &&
            !reminder.burned &&
            block.timestamp >= reminder.confirmationWindowStart &&
            block.timestamp <= reminder.reminderTime
        );
    }
    
    function shouldBurn(uint256 reminderId) external view returns (bool) {
        Reminder memory reminder = reminders[reminderId];
        return (
            !reminder.confirmed &&
            !reminder.burned &&
            block.timestamp > reminder.reminderTime
        );
    }
}`

export function VaultDeployer() {
  const { walletAddress } = useAuth()
  const [manualAddress, setManualAddress] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const copyContract = () => {
    navigator.clipboard.writeText(VAULT_CONTRACT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyTokenAddress = () => {
    navigator.clipboard.writeText(TOKEN_ADDRESS)
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Deploy ReminderVault Contract</CardTitle>
        <CardDescription>Follow these steps to deploy your vault on Base Sepolia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!walletAddress && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Connect your wallet from the home page to get started.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              Get Base Sepolia ETH
            </h3>
            <p className="text-xs text-muted-foreground ml-8">
              You need testnet ETH to deploy the contract and pay gas fees.
            </p>
            <Button asChild variant="outline" size="sm" className="ml-8 bg-transparent">
              <a href="https://www.alchemy.com/faucets/base-sepolia" target="_blank" rel="noopener noreferrer">
                Get Testnet ETH
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              Copy Contract Code
            </h3>
            <div className="ml-8 space-y-2">
              <Button onClick={copyContract} variant="outline" size="sm" className="w-full bg-transparent">
                <Copy className="h-3 w-3 mr-2" />
                {copied ? "Copied!" : "Copy ReminderVault.sol"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </span>
              Open Remix IDE
            </h3>
            <div className="ml-8 space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer">
                  Open Remix IDE
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Create a new file called <code className="bg-muted px-1 rounded">ReminderVault.sol</code> and paste the
                contract code
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </span>
              Compile Contract
            </h3>
            <div className="ml-8">
              <p className="text-xs text-muted-foreground">
                Go to the "Solidity Compiler" tab, select version <strong>0.8.20</strong>, and click "Compile
                ReminderVault.sol"
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                5
              </span>
              Deploy Contract
            </h3>
            <div className="ml-8 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium">Environment:</p>
                <p className="text-xs text-muted-foreground">Select "Injected Provider - MetaMask"</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">Network:</p>
                <p className="text-xs text-muted-foreground">Make sure MetaMask is on Base Sepolia (Chain ID: 84532)</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium">Constructor Parameter:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted p-2 rounded text-xs break-all">{TOKEN_ADDRESS}</code>
                  <Button onClick={copyTokenAddress} variant="outline" size="sm">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste this address in the _commitToken field, then click "Deploy"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                6
              </span>
              Save Deployed Address
            </h3>
            <div className="ml-8 space-y-2">
              <p className="text-xs text-muted-foreground">
                After deployment, copy the contract address from Remix and paste it below:
              </p>
              <input
                type="text"
                placeholder="0x..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm font-mono"
              />
              {manualAddress && manualAddress.startsWith("0x") && manualAddress.length === 42 && (
                <Alert className="mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-medium text-sm">Valid address! Add to environment variables:</p>
                    <div className="bg-muted p-2 rounded">
                      <code className="text-xs">NEXT_PUBLIC_VAULT_CONTRACT={manualAddress}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Go to <strong>Vars</strong> in the sidebar, add this variable, then refresh the app.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
