"use client";

import { useEffect } from "react";
import { scrollAppToFraction } from "@/lib/utils/scrollAppToTop";

/** Scroll app when `active` becomes true (e.g. form → exchanging/status step). */
export function useScrollAppToTopWhen(
  active: boolean,
  behavior: ScrollBehavior = "smooth",
  /** 0 = top, 0.5 = halfway (used by P2P deposit/withdrawal status). */
  scrollFraction = 0
) {
  useEffect(() => {
    if (!active) return;
    scrollAppToFraction(scrollFraction, behavior);
  }, [active, behavior, scrollFraction]);
}
