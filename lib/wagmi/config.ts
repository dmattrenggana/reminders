import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || undefined),
  },
  // Gunakan 'as any' untuk memaksa TypeScript menerima connector 
  // meskipun ada konflik versi library internal.
  connectors: [miniAppConnector() as any],
  ssr: false,
})
