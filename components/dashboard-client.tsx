"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, usePublicClient } from "wagmi";
import { useReminders } from "@/hooks/useReminders";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingCreate } from "@/components/floating-create";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, Loader2, Wallet, RefreshCw, 
  CheckCircle2, LogOut, Megaphone 
} from "lucide-react";
import Image from "next/image";
import sdk from "@farcaster/frame-sdk";
import { formatUnits, parseUnits } from "viem";
import { VAULT_ABI, VAULT_ADDRESS, TOKEN_ADDRESS } from "@/constants";

const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
const ERC20_ABI = [{ "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }] as const;

export default function DashboardClient() {
  const { user: providerUser, isLoaded: isFarcasterLoaded } = useFarcaster();
  const [contextUser, setContextUser] = useState<any>(null);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  
  const { activeReminders: reminders = [], loading: loadingReminders, refresh: refreshReminders } = useReminders();
  const { balance, symbol, refresh: refreshBalance } = useTokenBalance();
  const [isSDKReady, setIsSDKReady] = useState(false);
  const isFirstMount = useRef(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = useMemo(() => ({
    locked: reminders.filter(r => !r.isResolved).reduce((acc, curr) => acc + Number(curr.rewardPool), 0),
    completed: reminders.filter(r => r.isResolved && r.isCompleted).length,
    burned: reminders.filter(r => r.isResolved && !r.isCompleted).length,
    publicFeed: reminders.filter(r => !r.isResolved),
    myFeed: reminders.filter(r => r.creator?.toLowerCase() === address?.toLowerCase())
  }), [reminders, address]);

  const displayUser = contextUser || providerUser;
  const username = displayUser?.username;
  const pfpUrl = displayUser?.pfpUrl || displayUser?.pfp;
  const formattedBalance = (typeof balance === 'bigint') ? Number(formatUnits(balance, 18)).toFixed(2) : "0.00";

  // Perbaikan Koneksi Mobile & Auto-Connect
  useEffect(() => {
    if (isFirstMount.current) {
      const init = async () => {
        try {
          const context = await sdk.context;
          if (context?.user) setContextUser(context.user);
          await sdk.actions.ready();
          
          // Auto-connect jika berada di dalam Frame v2
          const fcConnector = connectors.find((c) => c.id === "farcaster-frame");
          if (fcConnector && !isConnected) {
            connect({ connector: fcConnector });
          }
        } catch (e) { console.error(e); } finally { setIsSDKReady(true); }
      };
      init();
      isFirstMount.current = false;
    }
  }, [connectors, isConnected, connect]);

  const handleConnect = async () => {
    // Gunakan Farcaster native picker jika tersedia
    const fcConnector = connectors.find((c) => c.id === "farcaster-frame");
    if (fcConnector) {
      connect({ connector: fcConnector });
    } else {
      const injectedConnector = connectors.find((c) => c.id === "injected");
      connect({ connector: injectedConnector || connectors[0] });
    }
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
    } catch (e) { return false; }
  };

  const handleCreateReminder = async (desc: string, amt: string, dl: string) => {
    if (!isConnected || !address) return alert("Please connect wallet");
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
      refreshReminders(); refreshBalance();
    } catch (error: any) { alert(error.shortMessage || "Failed"); } finally { setIsSubmitting(false); }
  };

  const handleHelpRemindMe = (reminder: any) => {
    const text = encodeURIComponent(`🚨 Urgency! Help remind @user for Task #${reminder.id}. One hour left before tokens are burned!`);
    window.open(`https://warpcast.com/~/compose?text=${text}`, "_blank");
  };

  const handleConfirmCompleted = async (id: number) => {
    if (!address) return;
    try {
      await writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'claimSuccess',
        args: [BigInt(id)],
      });
      refreshReminders();
    } catch (e: any) { alert(e.message); }
  };

  if (!isSDKReady || !isFarcasterLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-10 pb-32">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Reminders</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Never Miss What Matters</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-full border border-slate-200 shadow-sm">
                <div className="px-4 text-[11px] font-black text-[#4f46e5] border-r border-slate-200">
                   {formattedBalance} {symbol}
                </div>
                <Button variant="ghost" onClick={() => disconnect()} className="flex items-center gap-2 h-9 px-3 rounded-full bg-white transition-all shadow-sm">
                  {pfpUrl ? (
                    <img src={pfpUrl} alt="PFP" className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-50" referrerPolicy="no-referrer" />
                  ) : ( <Wallet className="w-4 h-4 text-indigo-500" /> )}
                  <span className="text-xs font-black">{username ? `@${username}` : `${address?.slice(0,4)}...`}</span>
                  <LogOut className="h-3 w-3 opacity-20 ml-1" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} className="rounded-full bg-[#4f46e5] hover:opacity-90 font-bold text-white h-12 px-8 shadow-lg transition-all">Connect Wallet</Button>
            )}
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: `Locked ${symbol}`, val: stats.locked, color: "border-b-indigo-500" },
             { label: "Completed", val: stats.completed, color: "border-b-green-500" },
             { label: "Burned", val: stats.burned, color: "border-b-red-500" },
             { label: "Total Tasks", val: reminders.length, color: "bg-[#4f46e5] text-white border-none shadow-indigo-100 shadow-xl" }
           ].map((s, i) => (
             <Card key={i} className={`rounded-3xl shadow-sm border-slate-100 overflow-hidden ${s.color}`}>
               <CardHeader className="pb-1"><CardTitle className="text-[10px] font-black uppercase opacity-60 tracking-wider">{s.label}</CardTitle></CardHeader>
               <CardContent><div className="text-2xl font-black">{s.val}</div></CardContent>
             </Card>
           ))}
        </div>

        <Tabs defaultValue="public" className="w-full">
          <div className="flex items-center justify-between mb-6 bg-white/60 backdrop-blur-sm p-2 rounded-3xl border border-slate-200 shadow-sm">
            <TabsList className="bg-transparent border-none gap-2">
              <TabsTrigger value="public" className="rounded-2xl px-6 font-black text-xs uppercase transition-all data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white">🌍 Public Feed</TabsTrigger>
              <TabsTrigger value="my" className="rounded-2xl px-6 font-black text-xs uppercase transition-all data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white">👤 My Feed</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" onClick={() => {refreshReminders(); refreshBalance();}} className="text-[#4f46e5] font-black text-[10px] uppercase">
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} /> Sync Network
            </Button>
          </div>

          <TabsContent value="public">
            <ReminderList items={stats.publicFeed} onHelp={handleHelpRemindMe} onConfirm={handleConfirmCompleted} address={address} />
          </TabsContent>
          <TabsContent value="my">
            <ReminderList items={stats.myFeed} onHelp={handleHelpRemindMe} onConfirm={handleConfirmCompleted} address={address} />
          </TabsContent>
        </Tabs>
      </div>

      <FloatingCreate symbol={symbol} isSubmitting={isSubmitting} onConfirm={handleCreateReminder} />
    </div>
  );
}

function ReminderList({ items, onHelp, onConfirm, address }: any) {
  if (!items.length) return (
    <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
      <Bell className="h-10 w-10 text-slate-100 mx-auto mb-4" />
      <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">No activity found</p>
    </div>
  );
  
  return (
    <div className="grid gap-5">
      {items.map((r: any) => {
        const isOwner = r.creator?.toLowerCase() === address?.toLowerCase();
        return (
          <Card key={r.id} className="bg-white border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4 w-full">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`text-[9px] font-black px-3 py-1 rounded-lg ${
                    r.isResolved ? "bg-slate-100 text-slate-400" : 
                    r.isDangerZone ? "bg-red-500 text-white animate-pulse" : 
                    "bg-indigo-50 text-indigo-700"
                  }`}>
                    {r.isResolved ? "SETTLED" : r.isDangerZone ? "DEADLINE" : "ACTIVE"}
                  </Badge>
                  {isOwner && <Badge variant="outline" className="text-[9px] font-black border-indigo-100 text-indigo-500 bg-indigo-50/30">MY TASK</Badge>}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Task #{r.id}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Creator: {isOwner ? "You" : `${r.creator?.slice(0,6)}...${r.creator?.slice(-4)}`}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {!r.isResolved && (
                    <Button 
                      disabled={!r.isDangerZone} 
                      onClick={() => onHelp(r)}
                      className={`h-9 px-5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${
                        r.isDangerZone 
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      }`}
                    >
                      <Megaphone className="w-3.5 h-3.5 mr-2" /> Help Remind Me
                    </Button>
                  )}
                  {isOwner && !r.isResolved && (
                    <Button 
                      onClick={() => onConfirm(r.id)} 
                      className="h-9 px-5 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] rounded-xl uppercase shadow-lg shadow-green-100"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Claim Success
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 px-8 py-6 rounded-[2rem] text-right border border-slate-100 w-full md:w-auto min-w-[150px]">
                <p className="text-3xl font-black text-[#4f46e5] leading-none mb-1">{r.rewardPool}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Locked Amount</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
