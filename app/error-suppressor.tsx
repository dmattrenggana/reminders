"use client"

import { useEffect } from "react"

export function ErrorSuppressor() {
  useEffect(() => {
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args: any[]) => {
      const message = typeof args[0] === "string" ? args[0] : JSON.stringify(args[0])

      if (
        message.includes("Analytics SDK") ||
        message.includes("AnalyticsSDKApiError") ||
        message.includes("Unsupported Node.js version") ||
        message.includes("@neynar/nodejs-sdk") ||
        (args[1] && typeof args[1] === "object" && args[1].context === "AnalyticsSDKApiError")
      ) {
        return
      }
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      const message = typeof args[0] === "string" ? args[0] : JSON.stringify(args[0])
      if (
        message.includes("Analytics SDK") ||
        message.includes("AnalyticsSDKApiError") ||
        message.includes("Unsupported Node.js version") ||
        message.includes("@neynar/nodejs-sdk")
      ) {
        return
      }
      originalWarn.apply(console, args)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null
}
