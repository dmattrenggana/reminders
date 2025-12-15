"use client"

import { AuthProvider } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"
import { OnchainKitProvider } from "@coinbase/onchainkit"
import { base } from "wagmi/chains"
import "@coinbase/onchainkit/styles.css"
import { ErrorSuppressor } from "./error-suppressor"
import { Suspense } from "react"

function AuthWrapper({ children }: { children: ReactNode }) {
  console.log("[v0] AuthWrapper rendering")
  return <AuthProvider>{children}</AuthProvider>
}

export function ProvidersClient({ children }: { children: ReactNode }) {
  console.log("[v0] ProvidersClient rendering")

  return (
    <>
      <ErrorSuppressor />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            {console.log("[v0] Suspense fallback showing")}
            Loading...
          </div>
        }
      >
        {console.log("[v0] OnchainKitProvider mounting")}
        <OnchainKitProvider
          chain={base}
          config={{
            appearance: {
              mode: "auto",
              name: "Reminders",
            },
          }}
        >
          {console.log("[v0] OnchainKitProvider mounted, rendering AuthWrapper")}
          <AuthWrapper>{children}</AuthWrapper>
        </OnchainKitProvider>
      </Suspense>
    </>
  )
}
