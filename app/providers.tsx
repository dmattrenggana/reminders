"use client"

import { AuthProvider } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"
import { OnchainKitProvider } from "@coinbase/onchainkit"
import { base } from "wagmi/chains"
import "@coinbase/onchainkit/styles.css"

function AuthWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ""}
      chain={base}
      miniKit={{ enabled: true }}
      config={{
        appearance: {
          mode: "auto",
          name: "Reminders",
        },
      }}
    >
      <AuthWrapper>{children}</AuthWrapper>
    </OnchainKitProvider>
  )
}
