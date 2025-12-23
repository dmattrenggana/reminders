# Wallet Connection Fix for Farcaster MiniApp

## Problem
When clicking "Confirm Reminder" or "Help remind me" buttons in the Farcaster miniapp, the error "Wallet not connected. Please connect your wallet to perform transactions." was shown, even though the UI showed the wallet was connected.

## Root Cause
The `ReminderService` class was not able to find a valid ethers signer because:

1. **Wagmi uses a different provider system** - Wagmi v2 uses `WalletClient` instead of ethers providers
2. **No conversion to ethers signer** - The `useReminderService` hook was passing `null` as signer, expecting `ensureContracts` to create it
3. **ensureContracts didn't check for Wagmi signer** - It only checked for Frame SDK provider or `window.ethereum`, but not for Wagmi's wallet client

## Solution

### 1. Update `useReminderService` Hook
Convert Wagmi's `WalletClient` to an ethers signer:

\`\`\`typescript
// hooks/use-reminder-service.ts
const { data: walletClient } = useWalletClient()

useEffect(() => {
  if (!isConnected || !walletClient) {
    setService(null)
    return
  }

  const createService = async () => {
    const { BrowserProvider } = await import("ethers")
    
    // Convert Wagmi wallet client to ethers provider
    const provider = new BrowserProvider(walletClient as any)
    const signer = await provider.getSigner()
    
    // Store signer in window for ReminderService to access
    (window as any).__wagmiSigner = signer
    
    // Create service with signer
    const newService = new ReminderService(signer)
    setService(newService)
  }

  createService()
}, [isConnected, walletClient])
\`\`\`

### 2. Update `ensureContracts` in ReminderService
Add check for `__wagmiSigner` as **Priority 1**:

\`\`\`typescript
// lib/contracts/reminder-service.ts
private async ensureContracts() {
  let activeSigner = this.signer

  // Priority 1: Wagmi signer (for Farcaster MiniApp with Wagmi connector)
  const wagmiSigner = (window as any).__wagmiSigner
  
  // Priority 2: Frame SDK signer (for Farcaster Frames)
  const frameSigner = (window as any).__frameSigner
  
  // Priority 3: Web wallet signer
  const webSigner = (window as any).__webSigner

  if (wagmiSigner) {
    console.log("[v0] Using stored Wagmi signer (Farcaster MiniApp)")
    activeSigner = wagmiSigner
  } else if (frameSigner) {
    // ... Frame SDK fallback
  } else if (webSigner) {
    // ... Web wallet fallback
  }
  
  // Connect contracts with active signer
  if (activeSigner && typeof activeSigner.getAddress === "function") {
    this.vaultContract = new Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_ABI, activeSigner)
    this.tokenContract = new Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, activeSigner)
  } else {
    throw new Error("Wallet not connected. Please connect your wallet to perform transactions.")
  }
}
\`\`\`

## Architecture

### Signer Priority Chain
1. **Wagmi Signer** (`__wagmiSigner`) - For Farcaster MiniApp via Wagmi connector ✅
2. **Frame SDK Signer** (`__frameSigner`) - For Farcaster Frames
3. **Web Wallet Signer** (`__webSigner`) - For browser wallet (MetaMask, etc.)

### Flow Diagram
\`\`\`
User clicks "Connect Wallet"
    ↓
Wagmi connects via Farcaster connector
    ↓
useWalletClient returns WalletClient
    ↓
useReminderService converts WalletClient → ethers signer
    ↓
Store signer in window.__wagmiSigner
    ↓
ReminderService uses signer for transactions
\`\`\`

## Benefits
1. ✅ **Proper Wagmi Integration** - Works with Wagmi v2's WalletClient
2. ✅ **Farcaster MiniApp Compatible** - Uses Farcaster Wagmi connector
3. ✅ **Backward Compatible** - Still supports Frames and web wallets
4. ✅ **Clean Architecture** - Signer creation happens in the hook, not in service

## Testing
After deployment:
1. Open miniapp in Warpcast
2. Click "Connect Wallet" - should show connected with username/pfp
3. Navigate to "My feed"
4. Click "Confirm Reminder" on a reminder in danger zone
5. ✅ Should open wallet transaction dialog (not "Wallet not connected" error)

## Related Files
- `hooks/use-reminder-service.ts` - Converts WalletClient to ethers signer
- `lib/contracts/reminder-service.ts` - Uses wagmiSigner from window
- `components/auth/connect-wallet-button.tsx` - Displays connection status
- `hooks/use-auto-connect.ts` - Auto-connects Farcaster wallet

## Date
December 23, 2025
