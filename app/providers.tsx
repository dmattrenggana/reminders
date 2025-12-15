"use client"

import { AuthProvider } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"

import { OnchainKitProvider } from "@coinbase/onchainkit"
import { base } from "viem/chains"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      miniKit={{ enabled: true, projectId: process.env.NEXT_PUBLIC_MINIKIT_PROJECT_ID }}
      config={{
        appearance: { name: "Base Reminders", logo: "/logo.jpg" },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </OnchainKitProvider>
  )
}
