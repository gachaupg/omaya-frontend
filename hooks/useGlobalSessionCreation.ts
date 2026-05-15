"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { AppDispatch } from "../store";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { ensureDeviceSessionForBrowser } from "@/features/settings/utils/ensureDeviceSession";

export const useGlobalSessionCreation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { ensureTokenFresh } = useTokenRefresh();

  const { isAuthenticated } = useSelector((state: any) => state.auth);

  const hasAttemptedSessionCreation = useRef(false);
  const wasAuthenticatedRef = useRef(false);

  const createSession = async () => {
    if (hasAttemptedSessionCreation.current) {
      return;
    }

    if (!isAuthenticated || typeof window === "undefined") {
      return;
    }

    if (
      pathname &&
      (pathname.includes("/auth/") ||
        pathname.includes("/login") ||
        pathname.includes("/register"))
    ) {
      return;
    }

    hasAttemptedSessionCreation.current = true;

    const hasValidToken = await ensureTokenFresh();
    if (!hasValidToken) {
      hasAttemptedSessionCreation.current = false;
      return;
    }

    await ensureDeviceSessionForBrowser(dispatch);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      wasAuthenticatedRef.current = false;
      hasAttemptedSessionCreation.current = false;
      return;
    }

    const justLoggedIn = !wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = true;

    if (justLoggedIn) {
      hasAttemptedSessionCreation.current = false;
    }

    if (hasAttemptedSessionCreation.current) {
      return;
    }

    const timer = setTimeout(() => {
      void createSession();
    }, justLoggedIn ? 400 : 1200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, pathname]);

  return { createSession };
};
