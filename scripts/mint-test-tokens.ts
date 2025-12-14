import { ethers } from "ethers"

/**
 * SECURITY NOTE: NEXT_PUBLIC_CONTRACT_ADDRESS is a blockchain contract address,
 * not an authentication token. It's safe to use here as it's public blockchain data.
 */
async function mintTestTokens() {
  const tokenAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY

  if (!tokenAddress || !rpcUrl || !privateKey) {
    console.error("Missing required environment variables")
    process.exit(1)
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)

  const tokenABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address account) public view returns (uint256)",
  ]

  const token = new ethers.Contract(tokenAddress, tokenABI, wallet)

  console.log("Minting test tokens...")
  console.log("To address:", wallet.address)

  const amount = ethers.parseEther("10000") // 10,000 tokens
  const tx = await token.mint(wallet.address, amount)

  console.log("Transaction hash:", tx.hash)
  await tx.wait()

  const balance = await token.balanceOf(wallet.address)
  console.log("New balance:", ethers.formatEther(balance), "COMMIT")

  console.log("✅ Test tokens minted successfully!")
}

mintTestTokens().catch(console.error)
