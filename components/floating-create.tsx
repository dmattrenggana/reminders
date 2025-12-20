"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Lock, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FloatingCreateProps {
  onConfirm: (desc: string, amount: string, deadline: string) => void;
  symbol: string;
  isSubmitting: boolean;
}

export function FloatingCreate({ onConfirm, symbol, isSubmitting }: FloatingCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    desc: "",
    amount: "",
    deadline: ""
  });

  // Helper untuk format tanggal ke YYYY-MM-DDTHH:mm (format input datetime-local)
  const formatDateForInput = (date: Date) => {
    return date.toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16);
  };

  const setQuickTime = (hours: number) => {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    setFormData({ ...formData, deadline: formatDateForInput(now) });
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0);
    setFormData({ ...formData, deadline: formatDateForInput(tomorrow) });
  };

  const setNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0);
    setFormData({ ...formData, deadline: formatDateForInput(nextWeek) });
  };

  const handleConfirm = () => {
    onConfirm(formData.desc, formData.amount, formData.deadline);
    // Kita tidak langsung menutup isOpen agar jika gagal, input tidak hilang
    // Penutupan bisa dilakukan di DashboardClient setelah sukses
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
            className="mb-6 w-[360px] rounded-[2.5rem] border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">New Goal</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Commit to Excellence</p>
              </div>
              <Target className="text-indigo-600 h-6 w-6" />
            </div>

            <div className="space-y-5">
              {/* Description Input */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</Label>
                <Input 
                  placeholder="What will you achieve?" 
                  className="rounded-2xl bg-white/50 border-none h-12 focus-visible:ring-indigo-500 shadow-inner"
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                />
              </div>

              {/* Deadline & Quick Presets */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deadline</Label>
                <Input 
                  type="datetime-local" 
                  className="rounded-2xl bg-white/50 border-none h-12 shadow-inner cursor-pointer"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setQuickTime(1)} className="px-3 py-1.5 rounded-full bg-indigo-100/50 text-[10px] font-bold text-indigo-700 hover:bg-indigo-200 transition-all">+1h</button>
                  <button type="button" onClick={() => setQuickTime(6)} className="px-3 py-1.5 rounded-full bg-indigo-100/50 text-[10px] font-bold text-indigo-700 hover:bg-indigo-200 transition-all">+6h</button>
                  <button type="button" onClick={() => setTomorrow()} className="px-3 py-1.5 rounded-full bg-purple-100/50 text-[10px] font-bold text-purple-700 hover:bg-purple-200 transition-all">Tomorrow</button>
                  <button type="button" onClick={() => setNextWeek()} className="px-3 py-1.5 rounded-full bg-blue-100/50 text-[10px] font-bold text-blue-700 hover:bg-blue-200 transition-all">Next Week</button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Amount to Lock ({symbol})</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="rounded-2xl bg-white/50 border-none h-12 font-bold shadow-inner"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              {/* Confirm Button */}
              <Button 
                disabled={isSubmitting || !formData.desc || !formData.amount || !formData.deadline}
                onClick={handleConfirm}
                className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                CONFIRM
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all ${
          isOpen ? "bg-slate-900 text-white shadow-none" : "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {isOpen ? <X className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
      </motion.button>
    </div>
  );
}
