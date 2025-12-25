import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

/**
 * Generate EIP-712 signature for claimReward
 * Message format: keccak256(abi.encodePacked(helper, reminderId, neynarScore))
 */
export async function POST(request: NextRequest) {
  try {
    const { helperAddress, reminderId, neynarScore } = await request.json();
    
    if (!helperAddress || reminderId === undefined || neynarScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: helperAddress, reminderId, neynarScore' },
        { status: 400 }
      );
    }

    // Get signer private key from environment
    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[SignClaim] SIGNER_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    
    // Encode message: keccak256(abi.encodePacked(helper, reminderId, neynarScore))
    // In ethers.js, we use solidityPackedKeccak256
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256'],
      [helperAddress, reminderId, neynarScore]
    );
    
    // Sign the message hash (this adds Ethereum prefix automatically)
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    
    console.log('[SignClaim] Generated signature:', {
      helperAddress,
      reminderId,
      neynarScore,
      signerAddress: wallet.address,
      signature,
    });

    return NextResponse.json({
      success: true,
      signature,
      signerAddress: wallet.address,
      messageHash,
    });

  } catch (error: any) {
    console.error('[SignClaim] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
