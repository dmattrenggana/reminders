"use client";

import { dynamic } from "next/dynamic";
import { Loader2 } from "lucide-react";

// Memastikan dashboard hanya dimuat di client
const DashboardClient = dynamic(() => import("@/components/dashboard-client"), { 
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-[#4f46e5]" />
    </div>
  )
});

export default function Page() {
  return <DashboardClient />;
}
