"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    locked: number;
    completed: number;
    burned: number;
    totalTasks: number;
  };
  symbol: string;
  reminders: any[];
}

export function StatsCards({ stats, symbol }: StatsCardsProps) {
  const cards = [
    { 
      label: `Locked ${symbol}`, 
      val: stats.locked.toFixed(2), 
      color: "border-b-indigo-500" 
    },
    { 
      label: "Completed", 
      val: stats.completed, 
      color: "border-b-green-500" 
    },
    { 
      label: "Burned", 
      val: stats.burned, 
      color: "border-b-red-500" 
    },
    { 
      label: "Total Tasks", 
      val: stats.totalTasks, 
      color: "bg-[#4f46e5] text-white border-none shadow-indigo-100 shadow-xl" 
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card 
          key={i} 
          className={`
            rounded-3xl shadow-sm border-slate-100 overflow-hidden ${card.color}
          `}
        >
          <CardHeader className="pb-1">
            <CardTitle className="
              text-[10px] font-black uppercase opacity-60 tracking-wider
            ">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{card.val}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
