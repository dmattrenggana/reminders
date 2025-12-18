"use client";

import { useState, useEffect } from "react";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  const { user, isLoaded } = useFarcaster();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Public Feed</h1>
        <Link href="/">
          <Button variant="ghost" size="sm">Back to Dashboard</Button>
        </Link>
      </header>

      <main className="flex-1 p-4">
        {!isLoaded || loading ? (
          <div className="flex justify-center p-10">
            <p className="animate-pulse">Loading feed...</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
             <div className="p-8 border-2 border-dashed rounded-2xl text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Community Activity</h3>
                <p className="text-sm text-muted-foreground">
                  {user ? `Logged in as @${user.username}` : "Join Warpcast to participate"}
                </p>
                <div className="mt-6 p-4 bg-muted rounded-lg italic text-sm">
                  No public reminders found yet.
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
