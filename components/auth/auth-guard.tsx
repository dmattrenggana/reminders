"use client";

import { useFarcaster } from "@/components/providers/farcaster-provider";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoaded } = useFarcaster();
  const router = useRouter();

  useEffect(() => {
    // Jika sudah selesai loading dan tidak ada user, arahkan ke home
    if (isLoaded && !user) {
      // Anda bisa aktifkan ini jika ingin memproteksi halaman
      // router.push("/"); 
    }
  }, [isLoaded, user, router]);

  // Jika sedang loading, tampilkan loading screen sederhana
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
