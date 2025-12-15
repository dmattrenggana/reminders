"use client"

import { AuthProvider } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"
import { OnchainKitProvider } from "@coinbase/onchainkit"
import { base } from "wagmi/chains"
import "@coinbase/onchainkit/styles.css"
import { ErrorSuppressor } from "./error-suppressor"
import { Suspense } from "react"

function AuthWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

export function ProvidersClient({ children }: { children: ReactNode }) {
  return (
    <>
      <ErrorSuppressor />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <OnchainKitProvider
          chain={base}
          config={{
            appearance: {
              mode: "auto",
              name: "Reminders",
            },
          }}
        >
          <AuthWrapper>{children}</AuthWrapper>
        </OnchainKitProvider>
      </Suspense>
    </>
  )
}
