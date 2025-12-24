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
      flex items-center justify-between mb-6 bg-white/80 backdrop-blur-md 
      p-3 md:p-4 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/50
      transition-all hover:shadow-xl hover:shadow-slate-300/50
    ">
      <TabsList className="bg-transparent border-none gap-3">
        <TabsTrigger 
          value="public" 
          className="
            h-11 md:h-12 px-5 md:px-7 rounded-2xl font-bold text-sm md:text-base 
            uppercase tracking-wide transition-all duration-200
            data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-slate-50
            data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-700
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4f46e5] 
            data-[state=active]:to-[#6366f1] data-[state=active]:text-white
            data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30
            data-[state=active]:scale-105
          "
        >
          <span className="mr-2 text-base md:text-lg">🌍</span>
          <span className="hidden sm:inline">Public Feed</span>
          <span className="sm:hidden">Public</span>
        </TabsTrigger>
        <TabsTrigger 
          value="my" 
          className="
            h-11 md:h-12 px-5 md:px-7 rounded-2xl font-bold text-sm md:text-base 
            uppercase tracking-wide transition-all duration-200
            data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-slate-50
            data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-700
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4f46e5] 
            data-[state=active]:to-[#6366f1] data-[state=active]:text-white
            data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30
            data-[state=active]:scale-105
          "
        >
          <span className="mr-2 text-base md:text-lg">👤</span>
          <span className="hidden sm:inline">My Feed</span>
          <span className="sm:hidden">My</span>
        </TabsTrigger>
      </TabsList>
      <Button 
        variant="ghost" 
        size="default"
        onClick={onRefresh}
        disabled={loadingReminders}
        className="
          h-11 md:h-12 px-4 md:px-6 rounded-2xl 
          text-[#4f46e5] hover:text-[#6366f1] 
          font-bold text-xs md:text-sm uppercase tracking-wide
          bg-slate-50 hover:bg-slate-100 
          border border-slate-200/80
          transition-all duration-200
          hover:shadow-md hover:shadow-indigo-500/20
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <RefreshCw 
          className={`h-4 w-4 md:h-5 md:w-5 mr-2 transition-transform duration-200 ${
            loadingReminders ? 'animate-spin' : 'hover:rotate-180'
          }`} 
        /> 
        <span className="hidden sm:inline">Sync Network</span>
        <span className="sm:hidden">Sync</span>
      </Button>
    </div>
  );
}
