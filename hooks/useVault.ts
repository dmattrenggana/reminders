import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS, CONTRACTS, COMMIT_TOKEN_ABI } from "@/lib/contracts/config";

// Use centralized ERC20 ABI from config
const ERC20_ABI = COMMIT_TOKEN_ABI;

export const useVault = (signer: ethers.Signer | null) => {
  if (!signer) {
    return {
      lockTokens: async () => { throw new Error("Wallet not connected") },
      claimHelper: async () => { throw new Error("Wallet not connected") },
      claimSuccess: async () => { throw new Error("Wallet not connected") }
    };
  }

  // Inisialisasi kontrak
  const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
  const tokenContract = new ethers.Contract(CONTRACTS.COMMIT_TOKEN, ERC20_ABI, signer);

  /**
   * Mengunci token dengan pengecekan Approval otomatis
   */
  const lockTokens = async (amount: string, deadline: number) => {
    try {
      const userAddress = await signer.getAddress();
      const parsedAmount = ethers.parseUnits(amount, 18);

      // 1. Cek Saldo User
      const balance = await tokenContract.balanceOf(userAddress);
      if (balance < parsedAmount) {
        throw new Error("Saldo token tidak mencukupi.");
      }

      // 2. Cek & Jalankan Allowance (Approve)
      const currentAllowance = await tokenContract.allowance(userAddress, VAULT_ADDRESS);
      
      if (currentAllowance < parsedAmount) {
        console.log("Meminta persetujuan (Approve) token...");
        // Meminta approve sebesar jumlah yang ingin di-lock
        const approveTx = await tokenContract.approve(VAULT_ADDRESS, parsedAmount);
        await approveTx.wait();
        console.log("Approve berhasil.");
      }

      // 3. Jalankan Fungsi lockTokens pada Vault
      // Menambahkan gasLimit manual krusial untuk kestabilan di dompet eksternal Base
      const tx = await vaultContract.lockTokens(parsedAmount, deadline, {
        gasLimit: 300000 
      });

      console.log("Transaksi Lock dikirim:", tx.hash);
      const receipt = await tx.wait();
      return receipt;
    } catch (error: any) {
      console.error("Kesalahan pada lockTokens:", error);
      // Menangkap pesan error agar lebih mudah dibaca di UI
      throw new Error(error.reason || error.message || "Transaksi gagal");
    }
  };

  /**
   * Klaim reward untuk helper dengan signature dari backend
   */
  const claimHelper = async (id: number, amount: string, address: string) => {
    try {
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

      // Menambahkan gasLimit untuk memastikan transaksi klaim tidak macet
      const tx = await vaultContract.claimHelperReward(id, amount, signature, {
        gasLimit: 400000
      });
      return await tx.wait();
    } catch (error: any) {
      console.error("Kesalahan pada claimHelper:", error);
      throw error;
    }
  };

  /**
   * Klaim sisa token jika tugas berhasil diselesaikan
   */
  const claimSuccess = async (id: number) => {
    try {
      const tx = await vaultContract.claimSuccess(id, {
        gasLimit: 250000
      });
      return await tx.wait();
    } catch (error: any) {
      console.error("Kesalahan pada claimSuccess:", error);
      throw error;
    }
  };

  return { lockTokens, claimHelper, claimSuccess };
};
