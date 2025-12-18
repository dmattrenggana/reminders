"use client";

import { useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

export function FrameSDKInitializer() {
  useEffect(() => {
    const initialize = async () => {
      sdk.actions.ready();
    };

    initialize();
  }, []);

  return null;
}
import { FrameSDKInitializer } from "@/components/FrameSDKInitializer"; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <FrameSDKInitializer /> 
          {children}
        </Providers>
      </body>
    </html>
  );
}
