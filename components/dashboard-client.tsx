"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useReminders } from "@/hooks/useReminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingCreate } from "@/components/floating-create";
import { 
  Bell, Loader2, Wallet, RefreshCw, 
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
  
  const { 
    activeReminders: reminders = [], 
    loading: loadingReminders, 
    refresh: refreshReminders 
  } = useReminders();
  
  const { balance, symbol, refresh: refreshBalance } = useTokenBalance();

  const [isSDKReady, setIsSDKReady] = useState(false);
  const isFirstMount = useRef(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandPurple = "bg-[#4f46e5]";
  const brandText = "text-[#4f46e5]";
  const brandShadow = "shadow-[#4f46e5]/30";

  // Hitung stats berdasarkan field rewardPool dari ABI Anda
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

  const handleConnect = () => {
    const injected = connectors.find(c => c.id === 'injected');
    const farcaster = connectors.find(c => c.id === 'farcaster-frame');
    
    // Gunakan connector yang sesuai dengan lingkungan (Miniapp vs Browser)
    if (farcaster && typeof window !== 'undefined' && (window as any).ethereum?.isFarcaster) {
      connect({ connector: farcaster });
    } else if (injected) {
      connect({ connector: injected });
    } else {
      alert("Wallet not found. Please install MetaMask extension.");
    }
  };

  const getUniversalSigner = async () => {
    if (typeof window === "undefined") throw new Error("Window not found");
    // Jika di dalam Farcaster Frame
    if (sdk?.wallet?.ethProvider) {
      const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider as any);
      return await provider.getSigner();
    }
    // Jika di Web Browser biasa
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      return await provider.getSigner();
    }
    throw new Error("No wallet provider detected.");
  };

  const handleCreateReminder = async (desc: string, amt: string, dl: string) => {
    if (!desc || !amt || !dl) return alert("Please fill all fields.");
    setIsSubmitting(true);
    try {
      const signer = await getUniversalSigner();
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      
      // Ambil alamat token RMND dari contract
      const tokenAddress = await vaultContract.rmndToken();
      const tokenContract = new ethers.Contract(tokenAddress, [
        "function approve(address spender, uint256 amount) public returns (bool)"
      ], signer);
      
      const amountInWei = ethers.parseUnits(amt, 18);
      const deadlineTimestamp = Math.floor(new Date(dl).getTime() / 1000);
      
      // Step 1: Approve
      const approveTx = await tokenContract.approve(VAULT_ADDRESS, amountInWei);
      await approveTx.wait();
      
      // Step 2: Lock
      const lockTx = await vaultContract.lockTokens(amountInWei, deadlineTimestamp);
      await lockTx.wait();
      
      alert("Tokens Locked Successfully!");
      refreshReminders(); refreshBalance();
    } catch (error: any) {
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompleted = async (id: number) => {
    try {
      const signer = await getUniversalSigner();
      const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const tx = await contract.claimSuccess(id);
      await tx.wait();
      alert("Goal Accomplished!");
      refreshReminders();
    } catch (error: any) {
      alert("Failed: " + (error.reason || error.message));
    }
  };

  const formatBalance = (val: any) => {
    if (!val || val === BigInt(0)) return "0";
    try {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(formatUnits(val, 18)));
    } catch (e) { return "0"; }
  };

  const truncateAddr = (addr: string | undefined) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Connected";

  if (!isSDKReady) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#4f46e5]" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-10 text-slate-900 font-sans pb-32">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-100">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">ReminderBase</h1>
              <p className={`${brandText} text-xs font-bold uppercase tracking-[0.2em]`}>On-Chain Accountability</p>
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
              <Button 
                onClick={handleConnect} 
                className={`rounded-full ${brandPurple} hover:opacity-90 h-12 px-8 font-bold text-white shadow-xl ${brandShadow} transition-all active:scale-95`}
              >
                <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="bg-white border-slate-100 shadow-sm border-b-4 border-b-indigo-500">
            <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Locked {symbol}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black">{stats.locked}</div></CardContent>
          </Card>
          <Card className="bg-white border-slate-100 shadow-sm border-b-4 border-b-green-500">
            <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Completed</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-green-600">{stats.completed}</div></CardContent>
          </Card>
          <Card className="bg-white border-slate-100 shadow-sm border-b-4 border-b-red-500">
            <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Burned</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-red-600">{stats.burned}</div></CardContent>
          </Card>
          <Card className={`${brandPurple} border-none shadow-xl ${brandShadow}`}>
            <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-white/70">Active Tasks</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-white">{reminders?.filter((r: any) => !r.isResolved).length || 0}</div></CardContent>
          </Card>
        </div>

        <main className="space-y-8 bg-white/50 p-6 rounded-[2rem] border border-slate-100">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recent Activity</h2>
            <Button variant="ghost" size="sm" onClick={() => {refreshReminders(); refreshBalance();}} className={`${brandText} font-black text-[10px] uppercase`}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} /> Sync Data
            </Button>
          </div>
          {reminders?.length > 0 ? (
            <div className="grid gap-5">
              {reminders.map((r: any) => (
                <Card key={r.id} className="bg-white border-slate-100 shadow-sm overflow-hidden rounded-2xl group hover:shadow-md transition-shadow">
                  <CardContent className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <Badge variant="outline" className={`text-[9px] font-black px-3 py-1 ${r.isResolved ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}>
                        {r.isResolved ? "SETTLED" : "ACTIVE COMMITMENT"}
                      </Badge>
                      <h3 className="text-xl font-black text-slate-800">Task #{r.id}</h3>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Bell className="w-3 h-3" />
                        <p className="text-[11px] font-bold uppercase">
                          Deadline: {new Date(Number(r.deadline) * 1000).toLocaleString()}
                        </p>
                      </div>
                      {!r.isResolved && (
                        <Button 
                          onClick={() => handleConfirmCompleted(r.id)} 
                          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] h-10 px-6 rounded-xl uppercase transition-all flex items-center gap-2 shadow-lg shadow-green-100"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark as Done
                        </Button>
                      )}
                    </div>
                    <div className="bg-slate-50 px-6 py-4 rounded-2xl text-right border border-slate-100 w-full md:w-auto">
                      <p className={`text-3xl font-black ${brandText}`}>{r.rewardPool}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locked {symbol}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2rem] border-4 border-dashed border-slate-100">
              <Bell className="h-12 w-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-300 text-sm font-black uppercase tracking-widest">Your commitments will appear here</p>
            </div>
          )}
        </main>
      </div>
      <FloatingCreate 
        symbol={symbol} 
        isSubmitting={isSubmitting} 
        onConfirm={handleCreateReminder} 
      />
    </div>
  );
}
