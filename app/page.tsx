"use client";

import { useFarcaster } from "@/components/providers/farcaster-provider";
import { ReminderDashboard } from "@/components/reminders/reminder-dashboard";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Shield, Coins, Users } from "lucide-react";

export default function HomePage() {
  // Menggunakan provider asli Farcaster
  const { user, isLoaded } = useFarcaster();

  // User dianggap authenticated jika data user berhasil dimuat oleh SDK
  const isAuthenticated = !!user;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-[#4A90E2] flex items-center justify-center flex-shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Base Reminders Logo"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                  Base Reminders
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Never Miss What Matters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <>
                  <Link href="/feed">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      Public Feed
                    </Button>
                  </Link>
                  {/* Menampilkan Foto Profil Farcaster */}
                  <img src={user.pfpUrl} className="h-8 w-8 rounded-full border" alt="pfp" />
                </>
              )}
              {/* Tombol connect bisa dihapus atau diganti dengan status jika di dalam Frame */}
              {!isAuthenticated && <Button size="sm">Open in Warpcast</Button>}
            </div>
          </div>
        </div>
      </header>

      <main>
        {isAuthenticated ? (
          <ReminderDashboard />
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="space-y-8">
              <div className="text-center space-y-4 py-12">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">
                  Commitment-Based Reminders on Base
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Set reminders with token stakes. Complete them on time or lose your tokens to reward pool.
                </p>
                <div className="pt-4">
                   <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                      Connect via Farcaster
                   </Button>
                </div>
              </div>

              {/* ... Sisa UI Preview Dashboard Anda tetap sama ... */}
              <div className="grid gap-4 md:grid-cols-3">
                 <Card className="p-6 border-2 border-dashed opacity-70">
                   <div className="flex items-center gap-4">
                     <Clock className="h-6 w-6 text-blue-500" />
                     <div>
                       <p className="text-sm text-muted-foreground">Active Reminders</p>
                       <p className="text-2xl font-bold">0</p>
                     </div>
                   </div>
                 </Card>
                 {/* Card lainnya */}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
