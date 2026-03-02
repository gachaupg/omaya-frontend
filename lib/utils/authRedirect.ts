"use client";

const AUTH_REDIRECT_KEY = "auth_redirect";
const EXPRESS_PREFILL_KEY = "express_prefill_state";

export const setAuthRedirectPath = (path: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
  } catch (error) {
    console.warn("Failed to set auth redirect path", error);
  }
};

/** Store express form state as fallback when URL params may be lost (e.g. long URLs) */
export const setExpressPrefillState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(EXPRESS_PREFILL_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
};

/** Consume express prefill from sessionStorage (fallback when URL has no prefill) */
export const consumeExpressPrefillState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EXPRESS_PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(EXPRESS_PREFILL_KEY);
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

export const consumeAuthRedirectPath = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const path = sessionStorage.getItem(AUTH_REDIRECT_KEY);
    if (path) {
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      return path;
    }
  } catch (error) {
    console.warn("Failed to consume auth redirect path", error);
  }

  return null;
};

export const peekAuthRedirectPath = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return sessionStorage.getItem(AUTH_REDIRECT_KEY);
  } catch (error) {
    console.warn("Failed to read auth redirect path", error);
    return null;
  }
};

export const buildExpressRedirectPath = (
  mode: "deposit" | "withdrawal",
  state?: Record<string, any>
): string => {
  const params = new URLSearchParams({
    mode,
    source: "public-express",
  });

  if (state) {
    params.set("prefill", encodeURIComponent(JSON.stringify(state)));
  }

  return `/dashboard/express-exchange?${params.toString()}`;
};

export const buildSwapRedirectPath = (state?: Record<string, any>): string => {
  const params = new URLSearchParams({
    source: "public-swap",
  });

  if (state) {
    params.set("prefill", encodeURIComponent(JSON.stringify(state)));
  }

  return `/dashboard/swap?${params.toString()}`;
};

const MONEYX_PREFILL_KEY = "moneyx_prefill_state";

export const buildMoneyXRedirectPath = (state?: Record<string, any>): string => {
  const params = new URLSearchParams({
    mode: "moneyx",
    source: "public-express",
  });

  if (state) {
    params.set("prefill", encodeURIComponent(JSON.stringify(state)));
  }

  return `/dashboard/exchange?${params.toString()}`;
};

export const setMoneyXPrefillState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MONEYX_PREFILL_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
};

export const consumeMoneyXPrefillState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MONEYX_PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(MONEYX_PREFILL_KEY);
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

