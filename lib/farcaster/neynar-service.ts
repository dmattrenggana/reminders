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
      // Perbaikan: SDK v3 mengharapkan objek config, bukan string langsung
      this.client = new NeynarAPIClient({
        apiKey: this.apiKey
      })
    }
  }

  /**
   * Send a reminder notification to a Farcaster user via Neynar
   */
  async sendReminderNotification(fid: number, reminderId: string, description: string): Promise<boolean> {
    try {
      if (!this.client || !this.apiKey) {
        console.warn("[v0] Neynar client not initialized - API key missing")
        return false
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "") ||
        "https://remindersbase.vercel.app"

      const frameUrl = `${baseUrl}/api/frame?id=${reminderId}&desc=${encodeURIComponent(description.substring(0, 100))}`

      const signerUuid = process.env.FARCASTER_SIGNER_UUID
      if (!signerUuid) {
        console.error("[v0] FARCASTER_SIGNER_UUID is missing")
        return false
      }

      const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          signer_uuid: signerUuid,
          text: `Reminder: ${description}\n\nConfirm your commitment before the deadline!`,
          embeds: [
            {
              url: frameUrl,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Neynar API error:", errorText)
        return false
      }

      return true
    } catch (error) {
      console.error("[v0] Error sending Neynar notification:", error)
      return false
    }
  }

  /**
   * Get user data to validate user exists
   */
  async getUserExists(fid: number): Promise<boolean> {
    try {
      if (!this.client) return false

      // PERBAIKAN: SDK v3 mengharapkan objek { fids: [number] }
      const response = await this.client.fetchBulkUsers({ fids: [fid] })
      
      return !!(response.users && response.users.length > 0)
    } catch (error) {
      console.error("[v0] Error fetching user:", error)
      return false
    }
  }
}
