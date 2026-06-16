"use client";

import { useEffect } from "react";

export const SIDEBAR_SECTION_RESET_EVENT = "omaya:sidebar-section-reset";

export type SidebarSection =
  | "dashboard"
  | "express"
  | "exchange"
  | "p2p"
  | "swap"
  | "account";

const HREF_TO_SECTION: Record<string, SidebarSection> = {
  "/dashboard": "dashboard",
  "/dashboard/express-exchange": "express",
  "/dashboard/exchange": "exchange",
  "/dashboard/p2p": "p2p",
  "/dashboard/swap": "swap",
  "/dashboard/account": "account",
};

export function hrefToSidebarSection(href: string): SidebarSection | null {
  const normalized = href.replace(/\/$/, "") || "/dashboard";
  return HREF_TO_SECTION[normalized] ?? null;
}

/** Signal that a sidebar section should reset to its default view (same route, no full reload). */
export function dispatchSidebarSectionReset(section: SidebarSection) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SIDEBAR_SECTION_RESET_EVENT, { detail: { section } })
  );
}

/** Listen for sidebar re-clicks on the active section and run a reset handler. */
export function useSidebarSectionReset(
  section: SidebarSection,
  onReset: () => void
) {
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ section: SidebarSection }>;
      if (customEvent.detail?.section === section) {
        onReset();
      }
    };

    window.addEventListener(SIDEBAR_SECTION_RESET_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_SECTION_RESET_EVENT, handler);
  }, [section, onReset]);
}
