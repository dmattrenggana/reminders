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
useEffect(() => {
  sdk.actions.ready();
}, []);
