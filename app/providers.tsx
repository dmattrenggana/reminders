import type { ReactNode } from "react"
import { ProvidersClient } from "./providers-client"
import "@coinbase/onchainkit/styles.css"

export function Providers({ children }: { children: ReactNode }) {
  return <ProvidersClient>{children}</ProvidersClient>
}
