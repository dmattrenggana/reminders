"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, usePublicClient } from "wagmi";
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
import { formatUnits, parseUnits } from "viem";
import { VAULT_ABI, VAULT_ADDRESS, TOKEN_ADDRESS } from "@/constants";

// Definisi Konstanta & ABI
const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export default function DashboardClient() {
  // Hooks
  const { user: providerUser, isLoaded: isFarcasterLoaded } = useFarcaster();
  const [contextUser, setContextUser] = useState<any>(null);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  
  const { 
    activeReminders: reminders = [], 
    loading: loadingReminders, 
    refresh: refreshReminders 
  } = useReminders();
  
  const { balance, symbol, refresh: refreshBalance } = useTokenBalance();

  const [isSDKReady, setIsSDKReady] = useState(false);
  const isFirstMount = useRef(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Styling Constants
  const brandPurple = "bg-[#4f46e5]";
  const brandText = "text-[#4f46e5]";
  const brandShadow = "shadow-[#4f46e5]/30";

  // FIX: Farcaster User Priority Logic
  const displayUser = contextUser || providerUser;
  const username = displayUser?.username;
  const pfpUrl = displayUser?.pfpUrl || displayUser?.pfp;

  // FIX: Safe Balance Formatting untuk Vercel Build
  const formattedBalance = (typeof balance === 'bigint') 
    ? Number(formatUnits(balance, 18)).toFixed(2) 
    : "0.00";

  // Perhitungan Statistik
  const stats = {
    locked: reminders?.filter((r: any) => !r.isResolved).reduce((acc: number, curr: any) => acc + (Number(curr.rewardPool) || 0), 0) || 0,
    completed: reminders?.filter((r: any) => r.isResolved && r.isCompleted).length || 0,
    burned: reminders?.filter((r: any) => r.isResolved && !r.isCompleted).length || 0
  };

  // FIX: Perbaikan Inisialisasi SDK agar Context User Terambil
  useEffect(() => {
    if (isFirstMount.current) {
      const init = async () => {
        try {
          // Ambil context terlebih dahulu
          const context = await sdk.context;
          if (context?.user) {
            setContextUser(context.user);
          }
          // Beritahu Frame siap
          await sdk.actions.ready();
        } catch (e) {
          console.error("SDK Ready Error:", e);
        } finally {
          setIsSDKReady(true);
        }
      };
      init();
      isFirstMount.current = false;
    }
  }, []);

  // Handlers
  const handleConnect = () => {
    const fcConnector = connectors.find((c) => c.id === "farcaster-frame");
    const injectedConnector = connectors.find((c) => c.id === "injected");
    connect({ connector: fcConnector || injectedConnector || connectors[0] });
  };

  const checkAllowance = async (neededAmount: bigint) => {
    if (!publicClient || !address) return false;
    try {
      const currentAllowance = await publicClient.readContract({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, VAULT_ADDRESS as `0x${string}`],
      });
      return (currentAllowance as bigint) >= neededAmount;
    } catch (e) {
      return false;
    }
  };

  const handleCreateReminder = async (desc: string, amt: string, dl: string) => {
    if (!isConnected || !publicClient || !address) return alert("Please connect your wallet.");
    setIsSubmitting(true);
    try {
      const amountInWei = parseUnits(amt, 18);
      const deadlineTimestamp = BigInt(Math.floor(new Date(dl).getTime() / 1000));

      const isApproved = await checkAllowance(amountInWei);
      if (!isApproved) {
        await writeContractAsync({
          address: TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [VAULT_ADDRESS as `0x${string}`, MAX_UINT256],
        });
      }

      await writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'lockTokens',
        args: [amountInWei, deadlineTimestamp],
      });
      
      alert("Success! Your commitment has been locked on-chain.");
      refreshReminders(); 
      refreshBalance();
    } catch (error: any) {
      alert("Error: " + (error.shortMessage || "Transaction failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompleted = async (id: number) => {
    if (!publicClient || !address) return;
    try {
      await writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'claimSuccess',
        args: [BigInt(id)],
      });
      refreshReminders();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  // Loading State
  if (!isSDKReady || !isFarcasterLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#4f46e5]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-10 text-slate-900 font-sans pb-32">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Reminders</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Never Miss What Matters</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-full border border-slate-200 shadow-sm">
                <div className="px-4 py-1 text-[11px] font-black font-mono border-r border-slate-200 text-indigo-600">
                   {formattedBalance} {symbol}
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={() => disconnect()} 
                  className="flex items-center gap-2 h-10 rounded-full bg-white hover:bg-red-50 hover:text-red-600 transition-all px-2 pr-4 shadow-sm border border-slate-100"
                >
                  {/* FIX: ReferrerPolicy agar PFP muncul */}
                  {pfpUrl ? (
                    <img 
                      src={pfpUrl} 
                      alt="PFP" 
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-50" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Wallet className="w-3 h-3 text-indigo-500" />
                    </div>
                  )}
                  
                  <span className="text-xs font-black">
                    {username ? `@${username}` : `${address?.slice(0,4)}...${address?.slice(-4)}`}
                  </span>
                  <LogOut className="h-3 w-3 opacity-30" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} className={`rounded-full ${brandPurple} hover:opacity-90 h-11 px-8 font-bold text-white shadow-lg active:scale-95 transition-all`}>
                <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
              </Button>
            )}
          </div>
        </header>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
           <Card className="bg-white border-slate-100 border-b-4 border-b-indigo-500 rounded-3xl overflow-hidden shadow-sm">
             <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Locked {symbol}</CardTitle></CardHeader>
             <CardContent><div className="text-2xl font-black">{stats.locked}</div></CardContent>
           </Card>
           <Card className="bg-white border-slate-100 border-b-4 border-b-green-500 rounded-3xl overflow-hidden shadow-sm">
             <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Completed</CardTitle></CardHeader>
             <CardContent><div className="text-2xl font-black text-green-600">{stats.completed}</div></CardContent>
           </Card>
           <Card className="bg-white border-slate-100 border-b-4 border-b-red-500 rounded-3xl overflow-hidden shadow-sm">
             <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Burned</CardTitle></CardHeader>
             <CardContent><div className="text-2xl font-black text-red-600">{stats.burned}</div></CardContent>
           </Card>
           <Card className={`${brandPurple} border-none shadow-xl ${brandShadow} rounded-3xl`}>
             <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase text-white/70">Active Tasks</CardTitle></CardHeader>
             <CardContent><div className="text-2xl font-black text-white">{reminders?.filter((r: any) => !r.isResolved).length || 0}</div></CardContent>
           </Card>
        </div>

        {/* MAIN LIST */}
        <main className="space-y-8 bg-white/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h2>
            <Button variant="ghost" size="sm" onClick={() => {refreshReminders(); refreshBalance();}} className={`${brandText} font-black text-[10px] uppercase`}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} /> Sync Data
            </Button>
          </div>
          
          {reminders?.length > 0 ? (
            <div className="grid gap-5">
              {reminders.map((r: any) => (
                <Card key={r.id} className="bg-white border-slate-100 shadow-sm overflow-hidden rounded-[2rem] hover:shadow-md transition-all">
                  <CardContent className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <Badge variant="outline" className={`text-[9px] font-black px-3 py-1 ${r.isResolved ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}>
                        {r.isResolved ? "SETTLED" : "ACTIVE COMMITMENT"}
                      </Badge>
                      <h3 className="text-xl font-black text-slate-800">Task #{r.id}</h3>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Bell className="w-3 h-3" />
                        <p className="text-[11px] font-bold uppercase tracking-tighter">Deadline: {new Date(Number(r.deadline) * 1000).toLocaleString()}</p>
                      </div>
                      {!r.isResolved && (
                        <Button onClick={() => handleConfirmCompleted(r.id)} className="mt-4 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] h-10 px-6 rounded-xl uppercase transition-all flex items-center gap-2 shadow-lg shadow-green-100">
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
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <Bell className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">No commitments found</p>
            </div>
          )}
        </main>
      </div>

      <FloatingCreate symbol={symbol} isSubmitting={isSubmitting} onConfirm={handleCreateReminder} />
    </div>
  );
}
