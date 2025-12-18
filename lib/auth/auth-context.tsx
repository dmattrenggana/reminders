"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import sdk from "@farcaster/frame-sdk";

interface AuthContextType {
  user: any;
  fid: number | null;
  loading: boolean;
  isConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fid, setFid] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Mengambil data user langsung dari frame context
        const context = await sdk.context;
        if (context?.user) {
          setFid(context.user.fid);
          setUser(context.user);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      fid, 
      loading, 
      isConnected: !!fid 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
