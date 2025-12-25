"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Info, Copy, ExternalLink } from "lucide-react"
import { useAccount } from "wagmi"
import { useFarcaster } from "@/components/providers/farcaster-provider"

// CONTRACT ADDRESSES (BASE MAINNET)
// These are display-only constants for the deploy page
// Actual addresses used by app come from environment variables
const TOKEN_ADDRESS = "0x8984b389cb82e05016db2e4c7230ca0791b9cb07"
const VAULT_ADDRESS = "0xd575D4174B34C1af976c54a1c14caf40395Ca0A1" // V5

export function VaultDeployer() {
  const { address: walletAddress } = useAccount()
  const { user: farcasterUser } = useFarcaster()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full max-w-3xl border-purple-100 shadow-sm">
      <CardHeader className="bg-slate-50/50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Contract Configuration</CardTitle>
            <CardDescription>Network: Base Mainnet</CardDescription>
          </div>
          {farcasterUser && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-100 shadow-sm">
               <img src={farcasterUser.pfpUrl} className="w-5 h-5 rounded-full" alt="pfp" />
               <span className="text-xs font-bold text-purple-700">@{farcasterUser.username}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Status Koneksi */}
        {!walletAddress ? (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <Info className="h-4 w-4 text-amber-700" />
            <AlertDescription>
              Please open this app in Warpcast to connect your Base wallet.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Connected Wallet</p>
                <p className="text-xs font-mono text-green-700">{walletAddress}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        )}

        <div className="space-y-4">
          {/* Section Token */}
          <div className="p-4 rounded-xl border bg-white space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Commitment Token (CA)</h3>
                <a 
                  href={`https://basescan.org/address/${TOKEN_ADDRESS}`} 
                  target="_blank" 
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[10px]"
                >
                  View on Basescan <ExternalLink className="h-3 w-3" />
                </a>
            </div>
            <div className="flex gap-2">
                <code className="flex-1 bg-slate-100 p-2 rounded text-[11px] break-all font-mono">
                    {TOKEN_ADDRESS}
                </code>
                <Button onClick={() => copyToClipboard(TOKEN_ADDRESS)} variant="outline" size="sm">
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
          </div>

          {/* Section Vault */}
          <div className="p-4 rounded-xl border bg-white space-y-3 font-bold border-purple-200">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-purple-800">Reminder Vault Address</h3>
                <a 
                  href={`https://basescan.org/address/${VAULT_ADDRESS}`} 
                  target="_blank" 
                  className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-[10px]"
                >
                  View on Basescan <ExternalLink className="h-3 w-3" />
                </a>
            </div>
            <div className="flex gap-2">
                <code className="flex-1 bg-purple-50 p-2 rounded text-[11px] break-all font-mono text-purple-900 border border-purple-100">
                    {VAULT_ADDRESS}
                </code>
                <Button onClick={() => copyToClipboard(VAULT_ADDRESS)} variant="outline" size="sm" className="border-purple-200 text-purple-700">
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-100">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700">
                You are currently on <strong>Base Mainnet</strong>. Any transaction will use real tokens.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
