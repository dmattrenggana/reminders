"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any;
  loading: boolean;
  fid: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<any>(null);
  const [loading] = useState(false);
  const [fid] = useState<number | null>(null);

  return (
    <AuthContext.Provider value={{ user, loading, fid }}>
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
