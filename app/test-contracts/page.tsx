"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestContractsPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  async function testContracts() {
    setLoading(true)
    const testResults: any = {}

    try {
      const { JsonRpcProvider, Contract } = await import("ethers")

      // Test RPC connection
      console.log("[TEST] Testing RPC connection...")
      const provider = new JsonRpcProvider("https://mainnet.base.org")
      const network = await provider.getNetwork()
      testResults.network = {
        chainId: Number(network.chainId),
        name: network.name,
        success: true,
      }
      console.log("[TEST] ✅ RPC connected:", testResults.network)

      // Get contract addresses
      const tokenAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""
      const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT || ""

      testResults.addresses = {
        token: tokenAddress,
        vault: vaultAddress,
      }

      // Test token contract
      console.log("[TEST] Testing token contract...")
      const tokenAbi = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
      ]
      const tokenContract = new Contract(tokenAddress, tokenAbi, provider)

      try {
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.totalSupply(),
        ])

        testResults.token = {
          name,
          symbol,
          decimals: Number(decimals),
          totalSupply: totalSupply.toString(),
          success: true,
        }
        console.log("[TEST] ✅ Token contract works:", testResults.token)
      } catch (error: any) {
        testResults.token = {
          error: error.message,
          success: false,
        }
        console.log("[TEST] ❌ Token contract failed:", error.message)
      }

      // Test vault contract
      console.log("[TEST] Testing vault contract...")
      const vaultAbi = [
        "function nextReminderId() view returns (uint256)",
        "function commitToken() view returns (address)",
      ]
      const vaultContract = new Contract(vaultAddress, vaultAbi, provider)

      try {
        const [nextId, commitToken] = await Promise.all([vaultContract.nextReminderId(), vaultContract.commitToken()])

        testResults.vault = {
          nextReminderId: Number(nextId),
          commitTokenAddress: commitToken,
          success: true,
        }
        console.log("[TEST] ✅ Vault contract works:", testResults.vault)
      } catch (error: any) {
        testResults.vault = {
          error: error.message,
          success: false,
        }
        console.log("[TEST] ❌ Vault contract failed:", error.message)
      }

      // Test getUserReminders
      console.log("[TEST] Testing getUserReminders...")
      const testAddress = "0x0000000000000000000000000000000000000000"
      const reminderAbi = ["function getUserReminders(address) view returns (uint256[])"]
      const reminderContract = new Contract(vaultAddress, reminderAbi, provider)

      try {
        const reminders = await reminderContract.getUserReminders(testAddress)
        testResults.getUserReminders = {
          success: true,
          count: reminders.length,
        }
        console.log("[TEST] ✅ getUserReminders works")
      } catch (error: any) {
        testResults.getUserReminders = {
          error: error.message,
          success: false,
        }
        console.log("[TEST] ❌ getUserReminders failed:", error.message)
      }
    } catch (error: any) {
      testResults.error = error.message
      console.error("[TEST] ❌ Test failed:", error)
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Contract Testing</h1>

      <Button onClick={testContracts} disabled={loading} className="mb-6">
        {loading ? "Testing..." : "Run Tests"}
      </Button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {results.network && (
            <Card className="p-4">
              <h3 className="font-bold mb-2">Network</h3>
              <pre className="text-sm">{JSON.stringify(results.network, null, 2)}</pre>
            </Card>
          )}

          {results.addresses && (
            <Card className="p-4">
              <h3 className="font-bold mb-2">Addresses</h3>
              <pre className="text-sm">{JSON.stringify(results.addresses, null, 2)}</pre>
            </Card>
          )}

          {results.token && (
            <Card className="p-4">
              <h3 className="font-bold mb-2">Token Contract {results.token.success ? "✅" : "❌"}</h3>
              <pre className="text-sm">{JSON.stringify(results.token, null, 2)}</pre>
            </Card>
          )}

          {results.vault && (
            <Card className="p-4">
              <h3 className="font-bold mb-2">Vault Contract {results.vault.success ? "✅" : "❌"}</h3>
              <pre className="text-sm">{JSON.stringify(results.vault, null, 2)}</pre>
            </Card>
          )}

          {results.getUserReminders && (
            <Card className="p-4">
              <h3 className="font-bold mb-2">getUserReminders {results.getUserReminders.success ? "✅" : "❌"}</h3>
              <pre className="text-sm">{JSON.stringify(results.getUserReminders, null, 2)}</pre>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
