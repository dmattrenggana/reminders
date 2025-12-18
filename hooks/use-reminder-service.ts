"use client"

import { useEffect, useState } from "react"
import { ReminderService } from "@/lib/contracts/reminder-service"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"

export function useReminderService() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [service, setService] = useState<any>(null) // Gunakan any untuk menghindari konflik tipe saat build

  useEffect(() => {
    if (isConnected && address && publicClient && walletClient) {
      try {
        // Kita paksa class-nya menjadi 'any' agar TypeScript tidak protes soal jumlah argumen
        const ServiceClass = ReminderService as any;
        
        // Coba inisialisasi dengan format objek (standar baru)
        const instance = new ServiceClass({
          publicClient,
          walletClient,
          address
        });
        
        setService(instance)
      } catch (error) {
        console.error("Failed to initialize ReminderService:", error)
        setService(null)
      }
    } else {
      setService(null)
    }
  }, [isConnected, address, publicClient, walletClient])

  return service as ReminderService | null
}
