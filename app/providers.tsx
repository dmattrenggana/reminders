"use client";

import { useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

export function FrameSDKInitializer() {
 useEffect(() => {
  sdk.actions.ready();
}, []);
    };
    initialize();
  }, []);

  return null;
}
