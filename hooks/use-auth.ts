"use client";

import { useState, useEffect } from "react";

export interface AuthContextType {
  address: string | null;
  farcasterUser: any;
  loading: boolean;
}

// Hook sederhana untuk simulasi data user Farcaster
export const useAuth = () => {
  const [authData, setAuthData] = useState<AuthContextType>({
    address: null,
    farcasterUser: null,
    loading: true,
  });

  useEffect(() => {
    // Di sini nantinya Anda bisa mengintegrasikan Farcaster Frame SDK
    setAuthData({
      address: "0x...",
      farcasterUser: null,
      loading: false,
    });
  }, []);

  return authData;
};
