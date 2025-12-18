"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useReminders } from "@/hooks/use-reminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Wallet, Bell, Coins, ExternalLink } from "lucide-react";

export default function FeedPage() {
  const { user, isLoaded: isFarcasterLoaded } = useFarcaster();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Ambil data asli dari Smart Contract
  const { reminders, isLoading: loadingReminders, refresh } = useReminders();
  const { balance, isLoading: loadingBalance } = useTokenBalance();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Header Section */}
        <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              RemindersBase
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {user ? `FID: ${user.fid} • @${user.username}` : "Not Connected"}
            </p>
          </div>
          
          {isConnected ? (
            <Button variant="ghost" size="sm" onClick={() => disconnect()} className="text-xs font-mono">
              {address?.slice(0, 4)}...{address?.slice(-4)}
            </Button>
          ) : (
            <Button size="sm" onClick={() => connect({ connector: connectors[0] })}>
              <Wallet className="mr-2 h-3 w-3" /> Connect
            </Button>
          )}
        </header>

        {/* Stats Cards */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] uppercase text-slate-400 flex items-center gap-2">
                  <Coins className="h-3 w-3" /> Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{loadingBalance ? "..." : balance} <span className="text-[10px] text-slate-400">TOKENS</span></div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] uppercase text-slate-400 flex items-center gap-2">
                  <Bell className="h-3 w-3" /> Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{reminders.length} <span className="text-[10px] text-slate-400">TASKS</span></div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <main className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Your Activity</h2>
            {isConnected && (
              <Button size="sm" className="h-8 rounded-full bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-1" /> New Reminder
              </Button>
            )}
          </div>

          {!isConnected ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                <Wallet className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-500">Connect your Farcaster wallet to manage your reminders.</p>
              <Button onClick={() => connect({ connector: connectors[0] })}>Connect Now</Button>
            </div>
          ) : loadingReminders || !isFarcasterLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-xs text-slate-400 animate-pulse">Syncing with Base Chain...</p>
            </div>
          ) : reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.map((r) => (
                <div key={r.id} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">{r.description}</h3>
                      <p className="text-[10px] text-slate-400">
                        Ends: {new Date(r.reminderTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-600">{r.tokenAmount} TOKENS</p>
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase font-bold tracking-tighter">
                        {r.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl">
              <p className="text-sm italic text-slate-400">No recent activity found.</p>
              <Button variant="link" size="sm" className="mt-2 text-indigo-500" onClick={refresh}>
                Refresh Data
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
