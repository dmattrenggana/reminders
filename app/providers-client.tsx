"use client"

import { AuthProvider } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"
import { OnchainKitProvider } from "@coinbase/onchainkit"
import { base } from "wagmi/chains"
import "@coinbase/onchainkit/styles.css"
import { ErrorSuppressor } from "./error-suppressor"

export function ProvidersClient({ children }: { children: ReactNode }) {
  return (
    <>
      <ErrorSuppressor />
      <OnchainKitProvider
        chain={base}
        config={{
          appearance: {
            mode: "auto",
            name: "Reminders",
          },
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </OnchainKitProvider>
    </>
  )
}
