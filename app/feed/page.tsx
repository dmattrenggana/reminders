"use client";

import { useState, useEffect } from "react";
// Pastikan path ini benar, jika error ganti ke path hook auth Anda
import { useAuth } from "@/lib/hooks/use-auth"; 

export default function FeedPage() {
  // Kita gunakan 'as any' sementara agar TypeScript tidak protes soal property 'address'
  const auth = useAuth() as any; 
  
  // Mengambil data dengan aman
  const address = auth?.address || "";
  const farcasterUser = auth?.farcasterUser;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading data feed
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground text-sm">
          {farcasterUser ? `Logged in as @${farcasterUser.username}` : "Viewing public feed"}
        </p>
      </header>

      <main className="flex-1">
        {loading ? (
          <div className="flex justify-center p-10">
            <p className="animate-pulse">Loading reminders...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Placeholder untuk isi feed */}
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-sm italic text-muted-foreground">No recent activity found.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
