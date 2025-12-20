"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useReminders } from "@/hooks/useReminders";
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
  CheckCircle2, LogOut 
} from "lucide-react";
import Image from "next/image";
import sdk from "@farcaster/frame-sdk";
import { formatUnits } from "viem";
import { ethers } from "ethers";
import { VAULT_ABI, VAULT_ADDRESS } from "@/constants";

export default function DashboardClient() {
  const { user } = useFarcaster();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // FIX: Destructuring dengan renaming agar sesuai dengan Hook
  const { 
    activeReminders: reminders = [], 
    loading: loadingReminders, 
    refresh: refreshReminders 
  } = useReminders();
  
  const { balance, symbol, refresh: refreshBalance } = useTokenBalance();

  const [isSDKReady, setIsSDKReady] = useState(false);
  const isFirstMount = useRef(true);

  // --- FORM STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandPurple = "bg-[#4f46e5]";
  const brandText = "text-[#4f46e5]";
  const brandShadow = "shadow-[#4f46e5]/30";

  // --- LOGIKA STATS REAL-TIME ---
  const stats = {
    locked: reminders?.filter((r: any) => !r.isResolved).reduce((acc: number, curr: any) => acc + (Number(curr.rewardPool) || 0), 0) || 0,
    completed: reminders?.filter((r: any) => r.isResolved && r.isCompleted).length || 0,
    burned: reminders?.filter((r: any) => r.isResolved && !r.isCompleted).length || 0
  };

  useEffect(() => {
    if (isFirstMount.current) {
      const init = async () => {
        try {
          await sdk.actions.ready();
        } catch (e) {
          console.error("SDK error:", e);
        } finally {
          setIsSDKReady(true);
        }
      };
      init();
      isFirstMount.current = false;
    }
  }, []);

  const handleCreateReminder = async () => {
    if (!description || !amount || !deadline) return alert("Please fill all fields.");
    setIsSubmitting(true);
    try {
      const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider as any);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      
      const tokenAddress = await vaultContract.rmndToken();
      const tokenContract = new ethers.Contract(tokenAddress, [
        "function approve(address spender, uint256 amount) public returns (bool)"
      ], signer);

      const amountInWei = ethers.parseUnits(amount, 18);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      const approveTx = await tokenContract.approve(VAULT_ADDRESS, amountInWei);
      await approveTx.wait();

      const lockTx = await vaultContract.lockTokens(amountInWei, deadlineTimestamp);
      await lockTx.wait();

      alert("Tokens Locked Successfully!");
      setIsModalOpen(false);
      setDescription(""); setAmount(""); setDeadline("");
      refreshReminders(); refreshBalance();
    } catch (error: any) {
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompleted = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const tx = await contract.claimSuccess(id);
      await tx.wait();

      alert("Completed! Funds returned.");
      refreshReminders();
    } catch (error: any) {
      alert("Failed: " + (error.reason || error.message));
    }
  };

  const formatBalance = (val: any) => {
    if (!val || val === BigInt(0)) return "0";
    try {
      const formatted = formatUnits(val, 18);
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(formatted));
    } catch (e) { return "0"; }
  };

  const truncateAddr = (addr: string | undefined) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Connected";

  if (!isSDKReady) return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-10 w-10 animate-spin text-[#4f46e5]" /></div>;

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
              <p className={`${brandText} text-xs font-bold uppercase tracking-[0.2em]`}>Never Miss What Matters</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3 bg-slate-50 pl-5 pr-1 py-1 rounded-full border border-slate-100 shadow-sm">
                <p className={`text-[10px] font-mono font-black ${brandText} border-r border-slate-200 pr-3`}>
                  {formatBalance(balance)} {symbol}
                </p>
                <Button variant="ghost" size="sm" onClick={() => disconnect()} className="rounded-full h-10 bg-white shadow-sm border-slate-200 text-xs font-black px-3 text-slate-700 hover:text-red-500 transition-all flex items-center gap-2">
                  {user?.pfpUrl && <img src={user.pfpUrl} alt="PFP" className="w-6 h-6 rounded-full border border-slate-100" />}
                  <span>{user?.username ? `@${user.username}` : truncateAddr(address)}</span>
                  <LogOut className="h-3 w-3 opacity-30" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => connect({ connector: connectors.find(c => c.id === 'farcasterFrame') || connectors[0] })} className={`rounded-full ${brandPurple} hover:opacity-90 h-12 px-8 font-bold text-white shadow-xl ${brandShadow} transition-all active:scale-95`}>
                <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
           <Card className="bg-white border-slate-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase">Locked RMND</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-black">{stats.locked}</div></CardContent></Card>
           <Card className="bg-white border-slate-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase">Completed</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-black">{stats.completed}</div></CardContent></Card>
           <Card className="bg-white border-slate-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase">Burned</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-black">{stats.burned}</div></CardContent></Card>
           <Card className={`${brandPurple} border-none shadow-xl ${brandShadow}`}><CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase text-white">My Tasks</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-black text-white">{reminders?.length || 0}</div></CardContent></Card>
        </div>

        <div className="flex justify-center">
            <Button disabled={!isConnected} onClick={() => setIsModalOpen(true)} className={`px-20 py-10 text-2xl font-black rounded-3xl ${brandPurple} text-white shadow-2xl ${brandShadow} transition-all active:scale-95`}>
                <Plus className="mr-4 h-8 w-8" /> Create Reminder
            </Button>
        </div>

        <main className="space-y-8 bg-white/50 p-6 rounded-3xl border border-slate-100">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-2xl font-black text-slate-800">Activity Feed</h2>
             <Button variant="ghost" size="sm" onClick={() => {refreshReminders(); refreshBalance();}} className={`${brandText} font-black text-[10px] uppercase`}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} /> Sync
             </Button>
           </div>
           
           {reminders?.length > 0 ? (
             <div className="grid gap-5">
               {reminders.map((r: any) => (
                 <Card key={r.id} className="bg-white border-slate-100 shadow-sm overflow-hidden">
                   <CardContent className="p-8 flex justify-between items-center">
                     <div className="space-y-2">
                        <Badge variant="outline" className={`text-[9px] font-black ${r.isResolved ? "bg-slate-100" : "bg-green-50 text-green-700"}`}>
                          {r.isResolved ? "RESOLVED" : "ACTIVE"}
                        </Badge>
                        <h3 className="text-xl font-black text-slate-800">Task #{r.id}</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                          Deadline: {new Date(Number(r.deadline) * 1000).toLocaleDateString()}
                        </p>
                        {!r.isResolved && (
                          <Button onClick={() => handleConfirmCompleted(r.id)} className="mt-4 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] h-9 px-6 rounded-xl uppercase transition-all flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4" /> Completed
                          </Button>
                        )}
                     </div>
                     <div className="text-right">
                       <p className={`text-3xl font-black ${brandText}`}>{r.rewardPool}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{symbol}</p>
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
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-slate-900">New Reminder</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-sm">Set your goal and stake {symbol}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
              <Input placeholder="e.g. Daily Coding" value={description} onChange={(e) => setDescription(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Stake</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-slate-100" placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-slate-100" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button disabled={isSubmitting} onClick={handleCreateReminder} className={`w-full h-16 rounded-2xl ${brandPurple} text-white font-black text-xl`}>
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Confirm & Lock"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
