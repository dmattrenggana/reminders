"use client";

import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Users, User } from "lucide-react";

interface TabsHeaderProps {
  loadingReminders: boolean;
  onRefresh: () => void;
}

export function TabsHeader({ loadingReminders, onRefresh }: TabsHeaderProps) {
  return (
    <div className="
      flex items-center justify-between gap-2 mb-6 bg-white/80 backdrop-blur-md 
      p-2.5 md:p-3 rounded-2xl md:rounded-3xl border border-slate-200/80 
      shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-300/50
    ">
      <TabsList className="bg-transparent border-none gap-2 flex-1 min-w-0">
        <TabsTrigger 
          value="public" 
          className="
            h-10 md:h-11 px-3 md:px-5 rounded-xl md:rounded-2xl 
            font-bold text-[10px] md:text-xs uppercase tracking-wide 
            transition-all duration-200 flex-1 min-w-0
            data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-slate-50
            data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-700
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4f46e5] 
            data-[state=active]:to-[#6366f1] data-[state=active]:text-white
            data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30
            data-[state=active]:scale-[1.02]
          "
        >
          <Users className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 flex-shrink-0" />
          <span className="truncate">Public Feed</span>
        </TabsTrigger>
        <TabsTrigger 
          value="my" 
          className="
            h-10 md:h-11 px-3 md:px-5 rounded-xl md:rounded-2xl 
            font-bold text-[10px] md:text-xs uppercase tracking-wide 
            transition-all duration-200 flex-1 min-w-0
            data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-slate-50
            data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-700
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4f46e5] 
            data-[state=active]:to-[#6366f1] data-[state=active]:text-white
            data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30
            data-[state=active]:scale-[1.02]
          "
        >
          <User className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 flex-shrink-0" />
          <span className="truncate">My Feed</span>
        </TabsTrigger>
      </TabsList>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onRefresh}
        disabled={loadingReminders}
        className="
          h-10 w-10 md:h-11 md:w-11 
          rounded-xl md:rounded-2xl 
          text-[#4f46e5] 
          bg-slate-50 hover:bg-slate-100 
          border border-slate-200/80
          transition-all duration-200
          hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/20
          hover:text-[#6366f1]
          active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-50
          disabled:hover:border-slate-200/80 disabled:hover:shadow-none
          flex-shrink-0
          relative
        "
        aria-label={loadingReminders ? "Syncing..." : "Refresh data"}
        title={loadingReminders ? "Syncing..." : "Refresh data"}
      >
        <RefreshCw 
          className={`h-4 w-4 md:h-5 md:w-5 transition-all duration-200 ${
            loadingReminders 
              ? 'animate-spin text-[#4f46e5]' 
              : 'text-[#4f46e5] hover:rotate-180'
          }`} 
        /> 
      </Button>
    </div>
  );
}
