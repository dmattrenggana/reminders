"use client";

import { useState, useEffect } from "react";
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
  Plus, 
  Bell, 
  Loader2, 
  Wallet, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Lock, 
  Calendar 
} from "lucide-center"; // Sesuaikan jika nama library lucide Anda berbeda
import Image from "next/image";
import sdk from "@farcaster/frame-sdk";

export default function DashboardClient() {
  const { user } = useFarcaster();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { reminders = [], isLoading: loadingReminders, refresh } = useReminders();
  const { balance } = useTokenBalance();

  // 1. Farcaster SDK Handshake
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        console.log("Mini App Ready!");
      } catch (e) {
        console.error("SDK ready error", e);
      }
    };
    init();
  }, []);

  // 2. Logic Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    deadline: ""
  });

  const brandPurple = "bg-[#4f46e5]";
  const brandText = "text-[#4f46e5]";
  const brandShadow = "shadow-[#4f46e5]/30";

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-10 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-100">
               <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">ReminderBase</h1>
              <p className={`${brandText} text-xs font-bold uppercase tracking-[0.2em]`}>
                {user ? `@${user.username}` : "Never Miss What Matters"}
              </p>
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

        {/* Stats Grid */}
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
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-white">Active Reminders</CardTitle>
              <Bell className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white tracking-tight">{reminders?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Big Action Button */}
        <div className="flex justify-center py-4">
            <Button 
              disabled={!isConnected}
              onClick={() => setIsModalOpen(true)}
              size="lg" 
              className={`w-full md:w-auto px-20 py-10 text-2xl font-black rounded-3xl ${brandPurple} hover:opacity-90 text-white shadow-2xl ${brandShadow} transition-all hover:scale-[1.03] active:scale-95 border-b-4 border-black/20 disabled:opacity-50`}
            >
                <Plus className="mr-4 h-8 w-8 stroke-[4px]" /> Create Reminders
            </Button>
        </div>

        {/* Activity Feed */}
        <main className="space-y-8 bg-white/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
           {/* ... bagian Activity Feed tetap sama seperti kode sebelumnya ... */}
           {/* Saya singkat agar tidak terlalu panjang, salin saja bagian main dari kode Anda */}
           <h2 className="text-2xl font-black">Activity Feed</h2>
           {/* ... sisa kode list reminders ... */}
        </main>

      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* ... salin seluruh bagian Dialog dari kode Anda ... */}
      </Dialog>
    </div>
  );
}
