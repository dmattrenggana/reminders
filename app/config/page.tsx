"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ExternalLink, Copy, Check, AlertTriangle } from "lucide-react"
import { CONTRACTS, CHAIN_CONFIG, validateContractConfig, REMINDER_VAULT_ABI } from "@/lib/contracts/config"
import { ethers } from "ethers"

export default function ConfigPage() {
  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string; decimals: number } | null>(null)
  const [vaultInfo, setVaultInfo] = useState<{ nextReminderId: number } | null>(null)
  const [contractStatus, setContractStatus] = useState<{
    tokenDeployed: boolean
    vaultDeployed: boolean
    vaultHasFunction: boolean
    tokenError?: string
    vaultError?: string
  }>({
    tokenDeployed: false,
    vaultDeployed: false,
    vaultHasFunction: false,
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const config = validateContractConfig()

  useEffect(() => {
    async function fetchContractInfo() {
      if (!config.isValid) {
        setLoading(false)
        return
      }

      try {
        const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.BASE_MAINNET.rpcUrl)
        console.log("[v0] Config page: Verifying contracts...")
        console.log("[v0] Token address:", CONTRACTS.COMMIT_TOKEN)
        console.log("[v0] Vault address:", CONTRACTS.REMINDER_VAULT)

        let tokenDeployed = false
        let tokenError = undefined
        try {
          const tokenCode = await provider.getCode(CONTRACTS.COMMIT_TOKEN)
          tokenDeployed = tokenCode !== "0x"
          console.log("[v0] Token contract code:", tokenCode.length > 10 ? "Deployed" : "Not deployed")

          if (tokenDeployed) {
            // Fetch token info
            const tokenContract = new ethers.Contract(
              CONTRACTS.COMMIT_TOKEN,
              [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)",
              ],
              provider,
            )

            const [name, symbol, decimals] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.decimals(),
            ])

            setTokenInfo({ name, symbol, decimals })
            console.log("[v0] Token info:", { name, symbol, decimals })
          } else {
            tokenError = "No contract deployed at this address"
          }
        } catch (error: any) {
          console.error("[v0] Token contract error:", error)
          tokenError = error.message || "Failed to verify token contract"
        }

        let vaultDeployed = false
        let vaultHasFunction = false
        let vaultError = undefined
        try {
          const vaultCode = await provider.getCode(CONTRACTS.REMINDER_VAULT)
          vaultDeployed = vaultCode !== "0x"
          console.log("[v0] Vault contract code:", vaultCode.length > 10 ? "Deployed" : "Not deployed")

          if (vaultDeployed) {
            // Test if the contract has the getUserReminders function
            const vaultContract = new ethers.Contract(CONTRACTS.REMINDER_VAULT, REMINDER_VAULT_ABI, provider)

            try {
              // Try calling nextReminderId (simple view function)
              const nextReminderId = await vaultContract.nextReminderId()
              setVaultInfo({ nextReminderId: Number(nextReminderId) })
              console.log("[v0] Vault nextReminderId:", Number(nextReminderId))

              // Try calling getUserReminders with a test address
              const testAddress = "0x0000000000000000000000000000000000000001"
              await vaultContract.getUserReminders(testAddress)
              vaultHasFunction = true
              console.log("[v0] Vault has getUserReminders function: YES")
            } catch (funcError: any) {
              console.error("[v0] Vault function test error:", funcError)
              if (funcError.message?.includes("could not decode result data")) {
                vaultError = "Contract exists but ABI mismatch. May be V2 contract, not V3."
                vaultHasFunction = false
              } else {
                vaultError = funcError.message || "Failed to call contract functions"
              }
            }
          } else {
            vaultError = "No contract deployed at this address"
          }
        } catch (error: any) {
          console.error("[v0] Vault contract error:", error)
          vaultError = error.message || "Failed to verify vault contract"
        }

        setContractStatus({
          tokenDeployed,
          vaultDeployed,
          vaultHasFunction,
          tokenError,
          vaultError,
        })
      } catch (error) {
        console.error("[v0] Error fetching contract info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContractInfo()
  }, [config.isValid])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contract Configuration</h1>
        <p className="text-muted-foreground">Verify your deployed contracts and network configuration</p>
      </div>

      {/* Configuration Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {config.isValid ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Configuration Valid
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Configuration Issues
              </>
            )}
          </CardTitle>
          <CardDescription>
            {config.isValid ? "All environment variables are properly configured" : "Please fix the following issues:"}
          </CardDescription>
        </CardHeader>
        {!config.isValid && (
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
              {config.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Network Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Network</CardTitle>
          <CardDescription>Base Mainnet configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Network Name</span>
            <Badge variant="secondary">{CHAIN_CONFIG.BASE_MAINNET.name}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Chain ID</span>
            <Badge variant="secondary">{CHAIN_CONFIG.BASE_MAINNET.chainId}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">RPC URL</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{CHAIN_CONFIG.BASE_MAINNET.rpcUrl}</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Block Explorer</span>
            <a
              href={CHAIN_CONFIG.BASE_MAINNET.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {CHAIN_CONFIG.BASE_MAINNET.blockExplorer}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Token Contract */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Token Contract
            {!loading && config.isValid && (
              <>
                {contractStatus.tokenDeployed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </>
            )}
          </CardTitle>
          <CardDescription>Your deployed ERC20 token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Contract Address</label>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-3 py-2 rounded flex-1 break-all">
                {CONTRACTS.COMMIT_TOKEN || "Not configured"}
              </code>
              {CONTRACTS.COMMIT_TOKEN && (
                <>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(CONTRACTS.COMMIT_TOKEN, "token")}>
                    {copied === "token" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`${CHAIN_CONFIG.BASE_MAINNET.blockExplorer}/address/${CONTRACTS.COMMIT_TOKEN}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>

          {!loading && config.isValid && (
            <div>
              {contractStatus.tokenDeployed ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Contract Deployed
                </Badge>
              ) : (
                <div className="space-y-2">
                  <Badge variant="destructive">✗ Contract Not Found</Badge>
                  {contractStatus.tokenError && <p className="text-sm text-red-600">{contractStatus.tokenError}</p>}
                </div>
              )}
            </div>
          )}

          {loading && config.isValid && <div className="text-sm text-muted-foreground">Loading token info...</div>}

          {tokenInfo && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <p className="text-sm font-medium">{tokenInfo.name}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Symbol</label>
                <p className="text-sm font-medium">{tokenInfo.symbol}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Decimals</label>
                <p className="text-sm font-medium">{tokenInfo.decimals}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vault Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vault Contract
            {!loading && config.isValid && (
              <>
                {contractStatus.vaultDeployed && contractStatus.vaultHasFunction ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : contractStatus.vaultDeployed ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </>
            )}
          </CardTitle>
          <CardDescription>ReminderVaultV3 deployment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Contract Address</label>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-3 py-2 rounded flex-1 break-all">
                {CONTRACTS.REMINDER_VAULT || "Not configured"}
              </code>
              {CONTRACTS.REMINDER_VAULT && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(CONTRACTS.REMINDER_VAULT, "vault")}
                  >
                    {copied === "vault" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`${CHAIN_CONFIG.BASE_MAINNET.blockExplorer}/address/${CONTRACTS.REMINDER_VAULT}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>

          {!loading && config.isValid && (
            <div className="space-y-2">
              {contractStatus.vaultDeployed ? (
                <>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ Contract Deployed
                  </Badge>
                  {contractStatus.vaultHasFunction ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                      ✓ V3 ABI Match
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">
                      ✗ ABI Mismatch
                    </Badge>
                  )}
                  {contractStatus.vaultError && (
                    <p className="text-sm text-yellow-600 mt-2">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {contractStatus.vaultError}
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Badge variant="destructive">✗ Contract Not Found</Badge>
                  {contractStatus.vaultError && <p className="text-sm text-red-600">{contractStatus.vaultError}</p>}
                </div>
              )}
            </div>
          )}

          {loading && config.isValid && <div className="text-sm text-muted-foreground">Loading vault info...</div>}

          {vaultInfo && (
            <div className="pt-2">
              <label className="text-xs text-muted-foreground">Total Reminders Created</label>
              <p className="text-sm font-medium">{vaultInfo.nextReminderId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Need to Update Configuration?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>To update your contract addresses, set these environment variables:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <code className="bg-white px-2 py-0.5 rounded text-xs">NEXT_PUBLIC_CONTRACT_ADDRESS</code> - Your token
              contract address
            </li>
            <li>
              <code className="bg-white px-2 py-0.5 rounded text-xs">NEXT_PUBLIC_VAULT_CONTRACT</code> - Your vault
              contract address
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
