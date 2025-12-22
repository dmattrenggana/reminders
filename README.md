# Base Reminders - Never Miss What Matters

A commitment-based reminder system built on Base Sepolia with Farcaster integration. Lock tokens as collateral for your reminders - if you ghost them, your tokens get burned.

## Features

- **Token-Backed Reminders**: Lock CMIT tokens as commitment when creating reminders
- **Smart Contract Security**: All logic runs on-chain on Base Sepolia testnet
- **Farcaster Integration**: Receive reminder notifications directly in your Farcaster feed
- **Auto-Burn Mechanism**: Miss a confirmation? Tokens automatically burn
- **Flexible Confirmation Window**: 1 hour before to 1 hour after your reminder time
- **Personal Vault**: Each user has their own token vault for managing stakes

## How It Works

### 1. Create a Reminder
- Connect your wallet (MetaMask) and Farcaster account
- Set what you want to remember
- Lock CMIT tokens as your commitment
- Choose date and time

### 2. Receive Notifications
- Notifications start 1 hour before your reminder
- Sent to your Farcaster feed as interactive Frames
- Repeats hourly until confirmed (every 10 min on Pro plan)

### 3. Confirm or Lose
- Confirm within the window to reclaim your tokens
- Miss it and tokens are automatically burned
- On-chain proof of your commitment

## Technology Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS v4
- **Blockchain**: Base Sepolia (Ethereum L2)
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Wallet**: ethers.js v6
- **Social**: Farcaster Frames
- **Deployment**: Vercel

## Smart Contracts

### CommitToken (ERC20)
Standard ERC20 token used for commitments. Features mint and burn functions.

### ReminderVault
Core contract managing all reminder logic:
- Lock tokens when creating reminders
- Confirm reminders to reclaim tokens
- Automatic burn mechanism for missed reminders
- Per-user reminder tracking

## Getting Started

### Prerequisites
- Node.js 18+ 
- MetaMask or Web3 wallet
- Base Sepolia ETH (for gas)
- CMIT tokens (minted when deploying)

### Installation

1. Clone and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_VAULT_CONTRACT=0x...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
FARCASTER_API_KEY=your_key
CRON_SECRET=your_secret
\`\`\`

3. Deploy smart contracts:
\`\`\`bash
npx hardhat compile
npx hardhat run scripts/deploy-contracts.ts --network baseSepolia
\`\`\`

4. Run development server:
\`\`\`bash
npm run dev
\`\`\`

### Deployment

Deploy to Vercel:
\`\`\`bash
vercel --prod
\`\`\`

The app includes automatic cron jobs for notifications.

## Documentation

- [Smart Contract Deployment](docs/DEPLOYMENT.md)
- [Farcaster Integration](docs/FARCASTER_SETUP.md)

## Architecture

### Confirmation Window

\`\`\`
Reminder Time: T
Notification Start: T - 1 hour
Confirmation Deadline: T + 1 hour

|-----------|--------T--------|
   ^                    ^
   Notify           Deadline
   Start
\`\`\`

### Notification Flow

\`\`\`
1. User creates reminder
2. Tokens locked in smart contract
3. Cron job checks hourly (every 10 min on Pro plan)
4. Sends Farcaster Frame notifications
5. User confirms (or doesn't)
6. Tokens returned or burned
\`\`\`

## Security

- All token logic runs on-chain
- Reentrancy protection
- Token approvals required before locking
- Non-custodial - users always control their wallets
- Open source smart contracts (verify on Etherscan)

## Roadmap

- [ ] Deploy to Base mainnet
- [ ] Add reminder categories/tags
- [ ] Group reminders and shared vaults
- [ ] Mobile app with push notifications
- [ ] Analytics dashboard
- [ ] DAO governance for parameters

## License

MIT

## Support

Need help? Open an issue or reach out on Farcaster.

---

Built with 💜 on Base
