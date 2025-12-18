"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CONTRACTS, REMINDER_VAULT_V3_ABI, COMMIT_TOKEN_ABI } from "@/lib/contracts/config"

export default function VerifyPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const verifyContracts = async () => {
    setLoading(true)
    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")

    const checks = {
      tokenAddress: CONTRACTS.COMMIT_TOKEN,
      vaultAddress: CONTRACTS.REMINDER_VAULT,
      tokenHasCode: false,
      vaultHasCode: false,
      tokenName: null as string | null,
      tokenSymbol: null as string | null,
      vaultNextId: null as number | null,
      getUserRemindersWorks: false,
      error: null as string | null,
    }

    try {
      // Check if token contract has code
      const tokenCode = await provider.getCode(CONTRACTS.COMMIT_TOKEN)
      checks.tokenHasCode = tokenCode !== "0x"
      console.log("[v0] Token contract code length:", tokenCode.length)

      if (checks.tokenHasCode) {
        try {
          const tokenContract = new ethers.Contract(CONTRACTS.COMMIT_TOKEN, COMMIT_TOKEN_ABI, provider)
          checks.tokenName = await tokenContract.name()
          checks.tokenSymbol = await tokenContract.symbol()
        } catch (e: any) {
          console.error("[v0] Token contract call failed:", e.message)
        }
      }

      // Check if vault contract has code
      const vaultCode = await provider.getCode(CONTRACTS.REMINDER_VAULT)
      checks.vaultHasCode = vaultCode !== "0x"
      console.log("[v0] Vault contract code length:", vaultCode.length)

      if (checks.vaultHasCode) {
        try {
          const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_V3_ABI, provider)

          // Try calling nextReminderId
          const nextId = await vaultContract.nextReminderId()
          checks.vaultNextId = Number(nextId)

          // Try calling getUserReminders with a test address
          const testAddress = "0x0000000000000000000000000000000000000001"
          await vaultContract.getUserReminders(testAddress)
          checks.getUserRemindersWorks = true
        } catch (e: any) {
          console.error("[v0] Vault contract call failed:", e.message)
          checks.error = e.message
        }
      }
    } catch (e: any) {
      checks.error = e.message
    }

    setResults(checks)
    setLoading(false)
  }

  useEffect(() => {
    verifyContracts()
  }, [])

  if (loading || !results) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Verifying Contracts...</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Contract Deployment Verification</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Environment Variables</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <span className="font-bold">Token Address:</span> {results.tokenAddress}
          </div>
          <div>
            <span className="font-bold">Vault Address:</span> {results.vaultAddress}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Token Contract Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={results.tokenHasCode ? "text-green-600" : "text-red-600"}>
              {results.tokenHasCode ? "✓" : "✗"}
            </span>
            <span>Contract has bytecode deployed</span>
          </div>
          {results.tokenName && (
            <div>
              Name: <span className="font-bold">{results.tokenName}</span>
            </div>
          )}
          {results.tokenSymbol && (
            <div>
              Symbol: <span className="font-bold">{results.tokenSymbol}</span>
            </div>
          )}
          {!results.tokenHasCode && (
            <div className="text-red-600 font-bold">❌ NO CONTRACT DEPLOYED AT THIS ADDRESS!</div>
          )}
        </div>
        <a
          href={`https://basescan.org/address/${results.tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View on Basescan →
        </a>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Vault Contract Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={results.vaultHasCode ? "text-green-600" : "text-red-600"}>
              {results.vaultHasCode ? "✓" : "✗"}
            </span>
            <span>Contract has bytecode deployed</span>
          </div>
          {results.vaultNextId !== null && (
            <div>
              Total Reminders Created: <span className="font-bold">{results.vaultNextId}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={results.getUserRemindersWorks ? "text-green-600" : "text-red-600"}>
              {results.getUserRemindersWorks ? "✓" : "✗"}
            </span>
            <span>getUserReminders() function works</span>
          </div>
          {!results.vaultHasCode && (
            <div className="text-red-600 font-bold">❌ NO CONTRACT DEPLOYED AT THIS ADDRESS!</div>
          )}
          {results.error && <div className="text-red-600 text-sm">Error: {results.error}</div>}
        </div>
        <a
          href={`https://basescan.org/address/${results.vaultAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View on Basescan →
        </a>
      </Card>

      {!results.vaultHasCode && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Action Required</h2>
          <div className="space-y-3 text-red-900">
            <p>Your vault contract is NOT deployed at the address:</p>
            <p className="font-mono bg-white p-2 rounded">{results.vaultAddress}</p>
            <p className="font-bold">Please check:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Did you deploy to Base Mainnet (Chain ID 8453)?</li>
              <li>Did you copy the correct contract address after deployment?</li>
              <li>Did you set NEXT_PUBLIC_VAULT_CONTRACT environment variable?</li>
              <li>Visit Basescan to verify the contract exists</li>
            </ol>
          </div>
        </Card>
      )}

      <Button onClick={verifyContracts}>Recheck Contracts</Button>
    </div>
  )
}
