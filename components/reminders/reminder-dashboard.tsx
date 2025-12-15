"use client"

import { useState } from "react"
import { CreateReminderDialog } from "./create-reminder-dialog"
import { ReminderList } from "./reminder-list"
import { ReminderStats } from "./reminder-stats"
import { FarcasterProfileCard } from "@/components/auth/farcaster-profile-card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import Link from "next/link"

export function ReminderDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReminderCreated = () => {
    setRefreshKey((prev) => prev + 1)
    setIsCreateOpen(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        <FarcasterProfileCard />

        {/* Stats Section */}
        <ReminderStats key={`stats-${refreshKey}`} />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Reminders</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your commitment-based reminders</p>
          </div>
          <div className="flex gap-2">
            <Link href="/feed">
              <Button variant="outline" size="lg">
                <Users className="h-5 w-5 mr-2" />
                Public Feed
              </Button>
            </Link>
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Reminder
            </Button>
          </div>
        </div>

        {/* Reminders List */}
        <ReminderList key={`list-${refreshKey}`} />
      </div>

      <CreateReminderDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={handleReminderCreated} />
    </div>
  )
}
