import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"
import { injected } from "wagmi/connectors" // Tambahkan ini

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    // Gunakan RPC publik sebagai backup jika env kosong
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || "https://mainnet.base.org"),
  },
  // Masukkan injected() agar bisa mendeteksi MetaMask, Rabby, Coinbase Wallet, dll.
  connectors: [
    miniAppConnector() as any,
    injected(), // Tambahkan ini untuk dompet eksternal
  ],
  ssr: true, // Ubah ke true jika Anda menggunakan Next.js App Router untuk stabilitas hydrasi
})
