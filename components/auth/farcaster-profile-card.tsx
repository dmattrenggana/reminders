"use client";

import { useFarcaster } from "@/components/providers/farcaster-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, ShieldCheck } from "lucide-react";

export function FarcasterProfileCard() {
  const { user, isLoaded } = useFarcaster();

  if (!isLoaded) {
    return (
      <Card className="w-full animate-pulse bg-slate-50">
        <CardContent className="p-6 h-24" />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Open in Warpcast to see your profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden border-purple-100 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.pfpUrl ? (
              <img 
                src={user.pfpUrl} 
                alt={user.username} 
                className="h-16 w-16 rounded-full border-2 border-purple-100 shadow-sm object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="h-8 w-8 text-purple-600" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-none">{user.displayName}</h3>
              <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">
                FID: {user.fid}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="text-xs text-muted-foreground line-clamp-1 italic">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
