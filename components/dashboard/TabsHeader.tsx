"use client";

import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

interface TabsHeaderProps {
  loadingReminders: boolean;
  onRefresh: () => void;
}

export function TabsHeader({ loadingReminders, onRefresh }: TabsHeaderProps) {
  return (
    <div className="
      flex items-center justify-between mb-6 bg-white/60 backdrop-blur-sm 
      p-2 rounded-3xl border border-slate-200 shadow-sm
    ">
      <TabsList className="bg-transparent border-none gap-2">
        <TabsTrigger 
          value="public" 
          className="
            rounded-2xl px-6 font-black text-xs uppercase transition-all 
            data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white
          "
        >
          🌍 Public Feed
        </TabsTrigger>
        <TabsTrigger 
          value="my" 
          className="
            rounded-2xl px-6 font-black text-xs uppercase transition-all 
            data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white
          "
        >
          👤 My Feed
        </TabsTrigger>
      </TabsList>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRefresh}
        className="text-[#4f46e5] font-black text-[10px] uppercase"
      >
        <RefreshCw 
          className={`h-4 w-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} 
        /> 
        Sync Network
      </Button>
    </div>
  );
}

