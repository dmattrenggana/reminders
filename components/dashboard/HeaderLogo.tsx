"use client";

import { useState } from "react";
import Image from "next/image";
import { createImageErrorHandler } from "@/lib/utils/image-error-handler";

export function HeaderLogo() {
  const [logoError, setLogoError] = useState(false);
  const handleLogoError = createImageErrorHandler(setLogoError, { suppressConsole: true });

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm bg-slate-100">
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
            <span className="text-indigo-600 font-bold text-lg">R</span>
          </div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tighter">Reminders</h1>
        <p className="
          text-[10px] font-bold text-slate-400 uppercase 
          tracking-widest leading-none
        ">
          Never Miss What Matters
        </p>
      </div>
    </div>
  );
}

