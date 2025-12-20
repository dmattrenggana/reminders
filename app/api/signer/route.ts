import { NextResponse } from "next/server";
import { ethers } from "ethers";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function POST(req: Request) {
  try {
    const { id, helperAddress, helperFid, creatorUsername, totalRewardPool } = await req.json();

    // 1. Verify Mention Activity via Neynar
    const searchUrl = `https://api.neynar.com/v2/farcaster/feed/user/mentions?fid=${helperFid}&limit=5`;
    const castRes = await fetch(searchUrl, {
      headers: { api_key: NEYNAR_API_KEY || "" }
    });
    const castData = await castRes.json();

    const hasMentioned = castData.casts?.some((cast: any) => 
      cast.text.toLowerCase().includes(`@${creatorUsername.toLowerCase()}`)
    );

    if (!hasMentioned) {
      return NextResponse.json({ error: "No reminder post found mentioning the creator" }, { status: 403 });
    }

    // 2. Fetch Neynar Score
    const userRes = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${helperFid}`, {
      headers: { api_key: NEYNAR_API_KEY || "" }
    });
    const userData = await userRes.json();
    const neynarScore = userData.users[0]?.profile?.score || 0;

    // 3. Reward Allocation Logic based on your request
    let percentage = 0;

    if (neynarScore >= 0.9) {
      percentage = 10; // 10% for score >= 0.9
    } else if (neynarScore >= 0.5) {
      percentage = 6;  // 6% for score 0.5 - 0.89
    } else {
      percentage = 2;  // 2% for score < 0.5
    }

    // 4. Calculate final reward amount in Wei
    const rewardAmount = (BigInt(totalRewardPool) * BigInt(percentage)) / BigInt(100);

    // 5. Generate Signature for Smart Contract
    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!privateKey) throw new Error("Server signer key missing");
    
    const wallet = new ethers.Wallet(privateKey);

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [id, helperAddress, rewardAmount.toString()]
    );

    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({ 
      signature, 
      rewardAmount: rewardAmount.toString(),
      score: neynarScore,
      tierPercentage: `${percentage}%`
    });

  } catch (error: any) {
    console.error("Signer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
