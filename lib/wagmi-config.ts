import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'

// Conditionally add WalletConnect only if project ID is provided
const connectors = [
  injected(),
  coinbaseWallet({ appName: 'Reminders App' }),
]

if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    })
  )
}

export const wagmiConfig = createConfig({
  chains: [base],
  connectors,
  ssr: true,
  transports: {
    [base.id]: http(),
  },
})
