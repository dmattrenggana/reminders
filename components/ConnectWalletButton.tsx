"use client";

// Re-export the actual ConnectWalletButton component
// This file exists to maintain backward compatibility
// The actual implementation is in components/auth/connect-wallet-button.tsx
// 
// NOTE: The previous implementation used @neynar/react which is not installed.
// We use the implementation from connect-wallet-button.tsx which uses 
// @farcaster/miniapp-sdk and our custom FarcasterProvider instead.
export { ConnectWalletButton } from "@/components/auth/connect-wallet-button";
