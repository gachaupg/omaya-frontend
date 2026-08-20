"use client";

import { useEffect } from "react";
import { loadChatwoot } from "@/lib/chatwoot/client";

/** Preloads Chatwoot in the background (bubble stays hidden — custom launcher only). */
export default function ChatwootLoader() {
  useEffect(() => {
    loadChatwoot().catch(() => {
      // Non-blocking — live chat opens on demand if preload fails.
    });
  }, []);

  return null;
}
