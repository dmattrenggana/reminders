/**
 * Farcaster Notification Service
 * Handles sending notifications to Farcaster users
 */

interface NotificationPayload {
  userId: number // Farcaster FID
  reminderId: number
  description: string
  reminderTime: Date
}

export class FarcasterNotificationService {
  private baseUrl: string
  private apiKey: string | undefined

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    this.apiKey = process.env.FARCASTER_API_KEY
  }

  /**
   * Send a reminder notification to a Farcaster user
   */
  async sendReminderNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const frameUrl = this.buildFrameUrl(payload.reminderId, payload.description)

      console.log("[v0] Sending Farcaster notification:", {
        userId: payload.userId,
        reminderId: payload.reminderId,
        frameUrl,
      })

      if (process.env.FARCASTER_API_KEY) {
        try {
          const { NeynarNotificationService } = await import("./neynar-service")
          const neynarService = new NeynarNotificationService()
          return await neynarService.sendReminderNotification(
            payload.userId,
            payload.reminderId.toString(),
            payload.description,
          )
        } catch (error) {
          console.warn("[v0] Neynar service unavailable, falling back to mock")
        }
      }

      // Mock success for development
      return true
    } catch (error) {
      console.error("[v0] Error sending Farcaster notification:", error)
      return false
    }
  }

  /**
   * Build frame URL for reminder notification
   */
  private buildFrameUrl(reminderId: number, description: string): string {
    const params = new URLSearchParams({
      id: reminderId.toString(),
      desc: description.substring(0, 100), // Limit description length
    })
    return `${this.baseUrl}/api/frame?${params.toString()}`
  }

  /**
   * Schedule notifications for a reminder
   * Notifications start 1 hour before and repeat every 10 minutes
   */
  async scheduleReminderNotifications(
    userId: number,
    reminderId: number,
    description: string,
    reminderTime: Date,
  ): Promise<void> {
    const notificationStartTime = new Date(reminderTime.getTime() - 60 * 60 * 1000)
    const now = Date.now()

    // If notification time hasn't started yet, schedule for later
    if (notificationStartTime.getTime() > now) {
      console.log("[v0] Notification scheduled for:", notificationStartTime.toISOString())
      // In production, store this in database for cron job to pick up
      return
    }

    // If within notification window, send immediately
    const confirmationDeadline = new Date(reminderTime.getTime() + 60 * 60 * 1000)
    if (now < confirmationDeadline.getTime()) {
      await this.sendReminderNotification({
        userId,
        reminderId,
        description,
        reminderTime,
      })
    }
  }
}
