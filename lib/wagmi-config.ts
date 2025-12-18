import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

const connectors = [
  injected(),
  coinbaseWallet({ appName: 'Reminders App' }),
]

// Add WalletConnect only if project ID is provided
if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  const { walletConnect } = require('wagmi/connectors')
  connectors.push(
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID })
  )
}

export const wagmiConfig = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http(),
  },
})
