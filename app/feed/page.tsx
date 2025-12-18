"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth/auth-context";

export default function FeedPage() {
  const { user, loading, fid } = useAuth();

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Feed</h1>
      <p className="mt-2 text-gray-600">Status: {fid ? `Connected as FID ${fid}` : "Not Connected"}</p>
      
      {/* Area Konten Feed */}
      <div className="mt-6 border-t pt-4">
        {fid ? (
          <p>Welcome!</p>
        ) : (
          <p className="text-red-500">Please login.</p>
        )}
      </div>
    </main>
  );
}
