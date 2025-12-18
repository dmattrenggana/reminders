"use client";

import { useState, useEffect } from "react";
import { useFarcaster } from "@/components/providers/farcaster-provider";

export default function FeedPage() {
  const { user, isLoaded } = useFarcaster();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground text-sm">
          {user ? `Logged in as @${user.username}` : "Viewing public feed"}
        </p>
      </header>

      <main className="flex-1">
        {loading || !isLoaded ? (
          <div className="flex justify-center p-10">
            <p className="animate-pulse">Loading reminders...</p>
          </div>
        ) : (
          <div className="space-y-4 text-center p-10 border-2 border-dashed rounded-xl">
            <p className="text-sm italic text-muted-foreground">No recent activity found.</p>
          </div>
        )}
      </main>
    </div>
  );
}
