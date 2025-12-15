import { NeynarAPIClient } from "@neynar/nodejs-sdk"

/**
 * Neynar Service for Farcaster Integration
 * Handles sending notifications via Neynar API
 */

export class NeynarNotificationService {
  private client: NeynarAPIClient | null = null
  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.FARCASTER_API_KEY
    if (this.apiKey) {
      this.client = new NeynarAPIClient({
        apiKey: this.apiKey,
      })
    }
  }

  /**
   * Send a reminder notification to a Farcaster user via Neynar
   */
  async sendReminderNotification(fid: number, reminderId: string, description: string): Promise<boolean> {
    try {
      if (!this.client) {
        console.warn("[v0] Neynar client not initialized - API key missing")
        return false
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "") ||
        "https://remindersbase.vercel.app"

      const frameUrl = `${baseUrl}/api/frame?id=${reminderId}&desc=${encodeURIComponent(description.substring(0, 100))}`

      console.log("[v0] Sending Neynar notification to FID:", fid)
      console.log("[v0] Frame URL:", frameUrl)

      // Send cast notification
      // Note: Neynar API for notifications may vary - check latest documentation
      const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey!,
        },
        body: JSON.stringify({
          signer_uuid: process.env.FARCASTER_SIGNER_UUID,
          text: `Reminder: ${description}\n\nConfirm your commitment before the deadline!`,
          embeds: [
            {
              url: frameUrl,
            },
          ],
          reply: {
            parent: fid,
          },
        }),
      })

      if (!response.ok) {
        console.error("[v0] Neynar API error:", await response.text())
        return false
      }

      return true
    } catch (error) {
      console.error("[v0] Error sending Neynar notification:", error)
      return false
    }
  }

  /**
   * Get user cast history to validate user exists
   */
  async getUserExists(fid: number): Promise<boolean> {
    try {
      if (!this.client) return false

      const user = await this.client.fetchBulkUsers([fid])
      return user.users.length > 0
    } catch (error) {
      console.error("[v0] Error fetching user:", error)
      return false
    }
  }
}
