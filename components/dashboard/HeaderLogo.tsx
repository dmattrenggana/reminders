"use client";

import { useState } from "react";
import Image from "next/image";
import { createImageErrorHandler } from "@/lib/utils/image-error-handler";

export function HeaderLogo() {
  const [logoError, setLogoError] = useState(false);
  const handleLogoError = createImageErrorHandler(setLogoError, { suppressConsole: true });

  return (
    <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden shadow-sm bg-slate-100 flex-shrink-0">
        {!logoError ? (
          <Image 
            src="/logo.jpg" 
            alt="Logo" 
            fill 
            className="object-cover" 
            priority
            onError={handleLogoError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-100">
            <span className="text-indigo-600 font-bold text-base md:text-lg">R</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-tight">Reminders</h1>
        <p className="
          text-[9px] md:text-[10px] font-bold text-slate-400 uppercase 
          tracking-widest leading-none mt-0.5
        ">
          Never Miss What Matters
        </p>
      </div>
    </div>
  );
}
