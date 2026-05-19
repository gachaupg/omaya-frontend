"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type DashboardNavigationContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
};

const DashboardNavigationContext =
  createContext<DashboardNavigationContextValue | null>(null);

/** Minimum time the route loader stays visible to avoid flicker. */
const MIN_NAV_LOADER_MS = 200;

export function DashboardNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const navStartedAtRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialPathnameRef = useRef(true);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    clearHideTimer();
    navStartedAtRef.current = Date.now();
    setIsNavigating(true);
  }, [clearHideTimer]);

  const finishNavigation = useCallback(() => {
    const startedAt = navStartedAtRef.current;
    navStartedAtRef.current = null;

    const elapsed = startedAt ? Date.now() - startedAt : MIN_NAV_LOADER_MS;
    const remaining = Math.max(0, MIN_NAV_LOADER_MS - elapsed);

    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsNavigating(false);
      hideTimerRef.current = null;
    }, remaining);
  }, [clearHideTimer]);

  useEffect(() => {
    if (isInitialPathnameRef.current) {
      isInitialPathnameRef.current = false;
      return;
    }
    finishNavigation();
    return clearHideTimer;
  }, [pathname, finishNavigation, clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  return (
    <DashboardNavigationContext.Provider
      value={{ isNavigating, startNavigation }}
    >
      {children}
    </DashboardNavigationContext.Provider>
  );
}

export function useDashboardNavigation() {
  const ctx = useContext(DashboardNavigationContext);
  if (!ctx) {
    throw new Error(
      "useDashboardNavigation must be used within DashboardNavigationProvider"
    );
  }
  return ctx;
}

/** Safe when provider is absent (e.g. tests). */
export function useDashboardNavigationOptional() {
  return useContext(DashboardNavigationContext);
}
