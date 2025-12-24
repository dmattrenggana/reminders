#!/usr/bin/env node

/**
 * V5 Signer Wallet Generator
 * Generates a new Ethereum wallet for signing claimReward messages
 */

const { Wallet } = require('ethers');

console.log('🔐 Generating V5 Signer Wallet...\n');

const wallet = Wallet.createRandom();

console.log('✅ Generated!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Add this to your .env.local:\n');
console.log(`SIGNER_PRIVATE_KEY=${wallet.privateKey}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🔑 Signer Address (use in contract deployment):\n');
console.log(`${wallet.address}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  SECURITY NOTES:');
console.log('   • Keep private key SECRET - never commit to git');
console.log('   • This wallet does NOT need ETH or tokens');
console.log('   • Used only for signing, not for transactions');
console.log('   • Add to Vercel env vars for production\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📖 Next Steps:');
console.log('   1. Copy SIGNER_PRIVATE_KEY to .env.local');
console.log('   2. Deploy V5 contract with signer address');
console.log('   3. Update NEXT_PUBLIC_VAULT_CONTRACT in .env.local');
console.log('   4. Test locally with: npm run dev');
console.log('   5. Add SIGNER_PRIVATE_KEY to Vercel env vars');
console.log('   6. Deploy to production\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

