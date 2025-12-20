import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/constants";

export const useVault = (signer: ethers.Signer | null) => {
  if (!signer) {
    return {
      lockTokens: async () => { throw new Error("Wallet not connected") },
      claimHelper: async () => { throw new Error("Wallet not connected") },
      claimSuccess: async () => { throw new Error("Wallet not connected") }
    };
  }

  const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

  const lockTokens = async (amount: string, deadline: number) => {
    const parsedAmount = ethers.parseUnits(amount, 18);
    const tx = await contract.lockTokens(parsedAmount, deadline);
    return await tx.wait();
  };

  const claimHelper = async (id: number, amount: string, address: string) => {
    const res = await fetch("/api/signer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id, 
        helperAddress: address, 
        rewardAmount: amount 
      }),
    });
    
    const { signature, error } = await res.json();
    if (error) throw new Error(error);

    const tx = await contract.claimHelperReward(id, amount, signature);
    return await tx.wait();
  };

  const claimSuccess = async (id: number) => {
    const tx = await contract.claimSuccess(id);
    return await tx.wait();
  };

  return { lockTokens, claimHelper, claimSuccess };
};
