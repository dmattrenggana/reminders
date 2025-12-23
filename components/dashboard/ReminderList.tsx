"use client";

import { Bell } from "lucide-react";
import { ReminderCard } from "@/components/reminders/reminder-card";

interface ReminderListProps {
  items: any[];
  feedType?: "public" | "my";
  address?: string;
  onHelpRemind?: (reminder: any) => void;
  onConfirm?: (reminderId: number) => void;
}

export function ReminderList({ 
  items, 
  feedType = "public", 
  address, 
  onHelpRemind, 
  onConfirm 
}: ReminderListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="
        text-center py-24 bg-white rounded-[3rem] 
        border-2 border-dashed border-slate-100
      ">
        <Bell width={40} height={40} className="text-slate-100 mx-auto mb-4" />
        <p className="
          text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]
        ">
          No activity found
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-5">
      {items.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          feedType={feedType}
          onHelpRemind={onHelpRemind}
          onConfirm={onConfirm}
        />
      ))}
    </div>
  );
}

