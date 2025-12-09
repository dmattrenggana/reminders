/**
 * Contract addresses and configuration for Base Sepolia
 *
 * SECURITY NOTE: These NEXT_PUBLIC_ variables contain blockchain contract addresses,
 * which are public information visible on the blockchain explorer. They are NOT
 * authentication tokens or API keys. Client-side access is required for Web3 interactions.
 */

export const CONTRACT_ADDRESSES = {
  COMMIT_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  REMINDER_VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT || "",
} as const

export const CONTRACTS = {
  // Blockchain contract addresses (public data, safe to expose)
  COMMIT_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  REMINDER_VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT || "",
}

export const CHAIN_CONFIG = {
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
}

export const TOKEN_SYMBOL = "RMND"

export const COMMIT_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
] as const

export const REMINDER_VAULT_ABI = [
  "function createReminder(uint256 tokenAmount, uint256 reminderTime, string memory description) returns (uint256)",
  "function confirmReminder(uint256 reminderId)",
  "function burnMissedReminder(uint256 reminderId)",
  "function getUserReminders(address user) view returns (uint256[])",
  "function getReminder(uint256 reminderId) view returns (address user, uint256 tokenAmount, uint256 reminderTime, uint256 confirmationDeadline, bool confirmed, bool burned, string memory description)",
  "function canConfirm(uint256 reminderId) view returns (bool)",
  "function shouldBurn(uint256 reminderId) view returns (bool)",
  "event ReminderCreated(uint256 indexed reminderId, address indexed user, uint256 tokenAmount, uint256 reminderTime, string description)",
  "event ReminderConfirmed(uint256 indexed reminderId, address indexed user, uint256 timestamp)",
  "event TokensBurned(uint256 indexed reminderId, address indexed user, uint256 tokenAmount)",
  "event TokensReclaimed(uint256 indexed reminderId, address indexed user, uint256 tokenAmount)",
] as const
