"use client"

import { useState } from "react"
import { ReminderList } from "./reminder-list"
import { ReminderStats } from "./reminder-stats"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import Link from "next/link"
import { FloatingCreate } from "@/components/floating-create"

export function ReminderDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReminderCreated = () => {
    setRefreshKey((prev) => prev + 1)
    setIsCreateOpen(false)
  }

  // Placeholder create function - should be passed from parent or use hook
  const createReminder = async (desc: string, amt: string, dl: string) => {
    console.log("Create reminder:", { desc, amt, dl });
    // TODO: Implement with V4 contract or use hook
    handleReminderCreated();
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
      <div className="space-y-6 sm:space-y-8">
        {/* Stats Section */}
        <ReminderStats key={`stats-${refreshKey}`} />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Your Reminders</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your commitment-based reminders</p>
          </div>
          <div className="flex gap-2">
            <Link href="/feed" className="flex-1 sm:flex-none">
              <Button variant="outline" size="default" className="w-full sm:w-auto bg-transparent">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm">Feed</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Reminders List */}
        <ReminderList key={`list-${refreshKey}`} />
      </div>

      {/* Use FloatingCreate - it has its own open/close state */}
      <FloatingCreate 
        symbol="RMND"
        isSubmitting={false}
        onConfirm={createReminder}
      />
    </div>
  )
}
