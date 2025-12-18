"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useReminders } from "@/hooks/use-reminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Bell, Loader2, Wallet, RefreshCw, 
  CheckCircle2, Flame, Lock, Calendar 
} from "lucide-react";
import Image from "next/image";
import sdk from "@farcaster/frame-sdk";

export default function DashboardClient() {
  const { user } = useFarcaster();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { reminders = [], isLoading: loadingReminders, refresh } = useReminders();
  const { balance } = useTokenBalance();

  const [isSDKReady, setIsSDKReady] = useState(false);
  const isFirstMount = useRef(true);

  // --- SAFETY TRIGGER UNTUK SPLASH SCREEN ---
  useEffect(() => {
    if (isFirstMount.current) {
      const init = async () => {
        try {
          // Memberi sedikit jeda agar DOM siap
          await new Promise(resolve => setTimeout(resolve, 500));
          await sdk.actions.ready();
          console.log("Farcaster SDK Ready Called");
        } catch (e) {
          console.error("SDK error:", e);
        } finally {
          setIsSDKReady(true);
        }
      };
      init();
      isFirstMount.current = false;
    }

    // Safety Net: Paksa Dashboard muncul setelah 4 detik 
    // meskipun blockchain sedang error/loading
    const timeout = setTimeout(() => {
      setIsSDKReady(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ description: "", amount: "", deadline: "" });

  const brandPurple = "bg-[#4f46e5]";
  const brandText = "text-[#4f46e5]";
  const brandShadow = "shadow-[#4f46e5]/30";
  const brandBorder = "border-[#4f46e5]";

  const stats = {
    locked: reminders?.reduce((acc, curr) => acc + (Number(curr.tokenAmount) || 0), 0) || 0,
    completed: reminders?.filter(r => r.status === 'Completed' || r.status === 'Confirmed').length || 0,
    burned: reminders?.filter(r => r.status === 'Burned' || r.status === 'Failed').length || 0
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsModalOpen(false);
      setFormData({ description: "", amount: "", deadline: "" });
      refresh();
      alert("Success! Reminder created");
    } finally { setIsSubmitting(false); }
  };

  // Jika SDK belum siap, tampilkan loading screen internal
  if (!isSDKReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#4f46e5]" />
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Initializing SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-10 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-100">
               <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">ReminderBase</h1>
              <div className="flex items-center gap-2">
                <p className={`${brandText} text-xs font-bold uppercase tracking-[0.2em]`}>
                  {user ? `@${user.username}` : "Never Miss What Matters"}
                </p>
                {loadingReminders && <Loader2 className="h-3 w-3 animate-spin text-slate-300" />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-4 bg-slate-50 pl-5 pr-1 py-1 rounded-full border border-slate-100">
                <p className={`text-sm font-mono font-bold ${brandText}`}>{balance} TOKENS</p>
                <Button variant="ghost" size="sm" onClick={() => disconnect()} className="rounded-full h-10 bg-white shadow-sm border-slate-200 text-xs font-bold px-4 text-slate-500">
                  {address?.slice(0, 6)}...
                </Button>
              </div>
            ) : (
              <Button onClick={() => connect({ connector: connectors[0] })} className={`rounded-full ${brandPurple} hover:opacity-90 h-12 px-8 font-bold text-white shadow-xl ${brandShadow} transition-all active:scale-95`}>
                <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Token Locked", val: stats.locked, icon: Lock, color: "text-amber-500" },
            { label: "Completed", val: stats.completed, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Burned", val: stats.burned, icon: Flame, color: "text-orange-500" },
          ].map((s, i) => (
            <Card key={i} className="bg-white border-slate-100 shadow-sm overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-slate-400">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{s.val}</div>
              </CardContent>
            </Card>
          ))}
          <Card className={`${brandPurple} border-none shadow-xl ${brandShadow}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-white/80">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-white">Active</CardTitle>
              <Bell className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white tracking-tight">{reminders?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center py-4">
            <Button 
              disabled={!isConnected}
              onClick={() => setIsModalOpen(true)}
              size="lg" 
              className={`w-full md:w-auto px-20 py-10 text-2xl font-black rounded-3xl ${brandPurple} text-white shadow-2xl ${brandShadow} transition-all hover:scale-[1.03] active:scale-95 border-b-4 border-black/20 disabled:opacity-50`}
            >
                <Plus className="mr-4 h-8 w-8 stroke-[4px]" /> Create Reminder
            </Button>
        </div>

        <main className="space-y-8 bg-white/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Activity Feed</h2>
            <Button variant="ghost" size="sm" onClick={refresh} className={`${brandText} font-black text-[10px] uppercase tracking-widest`}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} /> Sync Data
            </Button>
          </div>

          {loadingReminders && reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className={`h-12 w-12 animate-spin ${brandText} mb-4`} />
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Scanning Base Chain</p>
            </div>
          ) : reminders?.length > 0 ? (
            <div className="grid gap-5">
              {reminders.map((r: any) => (
                <Card key={r.id} className={`bg-white border-slate-100 shadow-sm border-l-[6px] ${brandBorder.replace('border-', 'border-l-')}`}>
                  <CardContent className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">{r.description}</h3>
                      <div className="flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        <Calendar className={`h-4 w-4 mr-2 ${brandText}`} />
                        Deadline: {new Date(r.reminderTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className={`text-3xl font-black ${brandText}`}>{r.tokenAmount}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOKENS</p>
                      </div>
                      <Badge className="bg-slate-50 text-slate-500 border border-slate-100 px-5 py-2 font-black text-[10px] rounded-xl tracking-[0.1em]">
                        {r.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2rem] border-4 border-dashed border-slate-100">
               <Bell className="h-10 w-10 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 text-lg font-black uppercase tracking-widest">No Active Reminders</p>
            </div>
          )}
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter text-slate-900">New Reminder</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">Set your goal and stake tokens.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Goal Description</Label>
              <Input 
                placeholder="e.g. Finish 5km run" 
                className="h-14 rounded-2xl"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stake</Label>
                <Input type="number" className="h-14 rounded-2xl" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deadline</Label>
                <Input type="date" className="h-14 rounded-2xl" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} required />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className={`w-full h-16 rounded-2xl ${brandPurple} text-white font-black text-xl shadow-xl ${brandShadow}`}>
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
