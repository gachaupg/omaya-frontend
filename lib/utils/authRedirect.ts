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

const EXPRESS_HOME_FORM_KEY = "express_home_form_state";
const MONEYX_PREFILL_KEY = "moneyx_prefill_state";
export const setExpressHomeFormState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXPRESS_HOME_FORM_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
};

/** Get persisted express form state (does not remove - used for init) */
export const getExpressHomeFormState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXPRESS_HOME_FORM_KEY);
    return raw ? (JSON.parse(raw) as Record<string, any>) : null;
  } catch {
    return null;
  }
};

/** Consume and clear persisted express form state after restore */
export const consumeExpressHomeFormState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXPRESS_HOME_FORM_KEY);
    if (!raw) return null;
    localStorage.removeItem(EXPRESS_HOME_FORM_KEY);
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

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

/** Key for payment modal prefill (when redirecting from home to add payment method after login) */
const PAYMENT_MODAL_PREFILL_KEY = "payment_modal_prefill";

/** Build redirect path for dashboard account > payment methods tab with add modal open */
export const buildPaymentMethodsRedirectPath = (prefill?: {
  method?: string;
  provider?: string;
}): string => {
  const params = new URLSearchParams({ tab: "payment", openAddModal: "1" });
  if (prefill?.method) params.set("method", prefill.method);
  if (prefill?.provider) params.set("provider", prefill.provider);
  return `/dashboard/account?${params.toString()}`;
};

/** Store payment modal prefill (method/provider) for after login */
export const setPaymentModalPrefill = (prefill: { method?: string; provider?: string }) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PAYMENT_MODAL_PREFILL_KEY, JSON.stringify(prefill));
  } catch {
    // Ignore
  }
};

/** Consume payment modal prefill after redirect */
export const consumePaymentModalPrefill = (): { method?: string; provider?: string } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAYMENT_MODAL_PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PAYMENT_MODAL_PREFILL_KEY);
    return JSON.parse(raw) as { method?: string; provider?: string };
  } catch {
    return null;
  }
};

