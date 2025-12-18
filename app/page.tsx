"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Menggunakan dynamic import dengan ssr: false untuk mencegah Hydration Error #418
const DashboardClient = dynamic(() => import("@/components/dashboard-client"), { 
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#4f46e5] mx-auto" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Connecting to Base Mainnet...
        </p>
      </div>
    </div>
  )
});

export default function Page() {
  return <DashboardClient />;
}
