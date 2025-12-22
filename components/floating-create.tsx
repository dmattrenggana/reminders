"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, X, Calendar, Target, Loader2, Clock } from "lucide-react";
import Image from "next/image";

interface FloatingCreateProps {
  symbol: string;
  isSubmitting: boolean;
  onConfirm: (desc: string, amt: string, dl: string) => void;
  status?: string;
}

export function FloatingCreate({ symbol, isSubmitting, onConfirm, status }: FloatingCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const brandPurple = "bg-[#4f46e5]";
  const brandShadow = "shadow-[#4f46e5]/30";

  // Helper untuk menambah waktu
  const handleAddDeadline = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDeadline(formatted);
  };

  return (
    /* FIX POSISI: Menggunakan left-1/2 dan -translate-x-1/2 agar presisi di tengah miniapp */
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px]">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={`w-full h-14 rounded-2xl ${brandPurple} text-white shadow-2xl shadow-indigo-200 font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300`}
        >
          <Plus className="w-6 h-6" />
          <span>New Reminder</span>
        </Button>
      ) : (
        <Card className="p-6 rounded-[2.5rem] shadow-2xl border-slate-100 bg-white animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {/* Logo App */}
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">New Reminder</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Never miss what matters</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-slate-50 text-slate-400">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Kolom Deskripsi Diperbesar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">What's the task?</label>
              <Textarea
                placeholder="Ex: Finish the landing page design..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-2xl border-slate-100 bg-slate-50 focus:ring-indigo-500 min-h-[130px] resize-none p-4 text-sm font-medium leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lock Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-2xl border-slate-100 bg-slate-50 pl-10 font-bold"
                  />
                  <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deadline</label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="rounded-2xl border-slate-100 bg-slate-50 pl-10 text-[10px] font-bold"
                  />
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
            </div>

            {/* Quick Add Buttons - Warna Seragam Slate */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Quick Add Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "+1H", val: 1 },
                  { label: "+6H", val: 6 },
                  { label: "Tomorrow", val: 24 },
                  { label: "Next Week", val: 168 },
                ].map((item) => (
                  <Button 
                    key={item.label}
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddDeadline(item.val)}
                    className="rounded-xl border-slate-100 text-slate-500 hover:bg-slate-50 font-bold text-[9px] uppercase h-9 px-0 transition-all active:scale-95"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {status && (
              <div className="text-xs text-slate-500 font-medium text-center py-2 px-3 bg-slate-50 rounded-xl">
                {status}
              </div>
            )}
            <Button
              disabled={isSubmitting}
              onClick={() => onConfirm(description, amount, deadline)}
              className={`w-full h-14 rounded-2xl ${brandPurple} text-white font-black uppercase tracking-widest text-xs shadow-lg ${brandShadow} active:scale-95 transition-all mt-2`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> {status || "Processing..."}
                </>
              ) : (
                "Lock & Commit"
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
