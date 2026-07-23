"use client";

const AUTH_REDIRECT_KEY = "auth_redirect";
const EXPRESS_PREFILL_KEY = "express_prefill_state";
const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";
const EXPRESS_LEGAL_RETURN_STATE_KEY = "omaya_express_legal_return_state";
const MONEYX_LEGAL_RETURN_STATE_KEY = "omaya_moneyx_legal_return_state";
const P2P_LEGAL_RETURN_STATE_KEY = "omaya_p2p_legal_return_state";
const SWAP_LEGAL_RETURN_STATE_KEY = "omaya_swap_legal_return_state";

const withLegalReturnPath = (state: Record<string, any>) => ({
  ...state,
  returnPath:
    state.returnPath ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/"),
});

/** Path to restore when user taps Back on a legal policy page after leaving exchange/swap. */
export const peekLegalReturnPath = (): string | null => {
  if (typeof window === "undefined") return null;
  if (!sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY)) return null;

  const keys = [
    SWAP_LEGAL_RETURN_STATE_KEY,
    EXPRESS_LEGAL_RETURN_STATE_KEY,
    EXPRESS_HOME_LEGAL_SESSION_KEY,
    MONEYX_LEGAL_RETURN_STATE_KEY,
    P2P_LEGAL_RETURN_STATE_KEY,
    RATES_CALCULATOR_STATE_KEY,
  ];

  for (const key of keys) {
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const state = JSON.parse(raw) as Record<string, any>;
      if (typeof state.returnPath === "string" && state.returnPath) {
        return state.returnPath;
      }
    } catch {
      // try next key
    }
  }

  return "/";
};

export const setAuthRedirectPath = (path: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
  } catch (error) {
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

/** Save express form state before navigating to legal pages (Terms, Privacy, etc.) so back button restores it */
export const setExpressLegalReturnState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      EXPRESS_LEGAL_RETURN_STATE_KEY,
      JSON.stringify(withLegalReturnPath(state))
    );
    sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
  } catch {
    // Ignore storage errors
  }
};

const normalizeExpressLegalReturnPayload = (
  state: Record<string, any>
): Record<string, any> => {
  const paymentDetail = state.selectedPaymentDetail ?? state.payment;
  const paymentDetails =
    state.selectedPaymentDetails ??
    state.paymentDetails ??
    (paymentDetail ? [paymentDetail] : undefined);
  const expanded = Boolean(
    state.isTransactionSubmitted ?? state.isFirstCardSubmitted
  );

  return {
    mode: state.mode,
    amountValue: state.payAmount ?? state.amountValue,
    amountInput: state.payAmountInput ?? state.amountInput,
    receiveAmountValue: state.getAmount ?? state.receiveAmountValue,
    receiveAmountInput: state.getAmountInput ?? state.receiveAmountInput,
    scrollY: state.scrollY,
    payBank: state.payBank,
    payment: paymentDetail,
    paymentDetails,
    asset: state.selectedAsset ?? state.asset,
    selectedAsset: state.selectedAsset ?? state.asset,
    selectedNetwork: state.selectedNetwork,
    walletAddress: state.walletAddress,
    termsAccepted: state.termsAccepted ?? state.isTermsAccepted,
    apiResponse: state.apiResponse,
    transactionCode: state.transactionCode,
    isFirstCardSubmitted: expanded,
    isTransactionSubmitted: expanded,
    expandedTerms: state.expandedTerms,
    withdrawalAddress: state.withdrawalAddress,
    payoutAddress: state.payoutAddress,
    qrCodeUrl: state.qrCodeUrl,
    transactionId: state.transactionId,
    responseMessage: state.responseMessage,
    websocketUrl: state.websocketUrl,
  };
};

/** Read dashboard express legal return state without clearing. */
export const peekExpressDashboardLegalReturnStateIfReturning =
  (): Record<string, any> | null => {
    if (typeof window === "undefined") return null;
    if (!sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY)) return null;
    try {
      const raw = sessionStorage.getItem(EXPRESS_LEGAL_RETURN_STATE_KEY);
      if (!raw) return null;
      return normalizeExpressLegalReturnPayload(JSON.parse(raw));
    } catch {
      return null;
    }
  };

export const clearExpressDashboardLegalReturnFlag = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
};

export const finalizeExpressDashboardLegalReturnState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
  sessionStorage.removeItem(EXPRESS_LEGAL_RETURN_STATE_KEY);
};

/** Consume express legal return state when user returns from Terms/Privacy/etc. */
export const consumeExpressLegalReturnState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const returning = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
    if (!returning) return null;
    const raw = sessionStorage.getItem(EXPRESS_LEGAL_RETURN_STATE_KEY);
    if (!raw) {
      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      return null;
    }
    sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
    sessionStorage.removeItem(EXPRESS_LEGAL_RETURN_STATE_KEY);
    return normalizeExpressLegalReturnPayload(JSON.parse(raw));
  } catch {
    sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
    sessionStorage.removeItem(EXPRESS_LEGAL_RETURN_STATE_KEY);
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

const SWAP_TRANSACTION_DATA_KEY = "swap_transaction_data";

export const setSwapTransactionHandoff = (payload: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SWAP_TRANSACTION_DATA_KEY, JSON.stringify(payload));
};

export const getSwapTransactionHandoff = (): Record<string, unknown> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SWAP_TRANSACTION_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const clearSwapTransactionHandoff = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SWAP_TRANSACTION_DATA_KEY);
};

export const buildSwapResumePath = () => "/dashboard/swap?resumeStatus=1";

const EXPRESS_HOME_FORM_KEY = "express_home_form_state";
const EXPRESS_HOME_LEGAL_SESSION_KEY = "express_home_legal_session";
const RATES_CALCULATOR_STATE_KEY = "rates_calculator_state";
const MONEYX_PREFILL_KEY = "moneyx_prefill_state";

export const setExpressHomeFormState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    const payload = withLegalReturnPath({
      ...state,
      expandedTerms: state.expandedTerms ?? true,
      scrollY:
        typeof state.scrollY === "number"
          ? state.scrollY
          : typeof window !== "undefined"
            ? window.scrollY
            : 0,
    });
    localStorage.setItem(EXPRESS_HOME_FORM_KEY, JSON.stringify(payload));
    sessionStorage.setItem(EXPRESS_HOME_LEGAL_SESSION_KEY, JSON.stringify(payload));
    sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
  } catch {
    // Ignore
  }
};

/** Save rates calculator state before navigating to legal pages */
export const setRatesCalculatorLegalReturnState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      RATES_CALCULATOR_STATE_KEY,
      JSON.stringify(withLegalReturnPath(state))
    );
    localStorage.setItem(
      RATES_CALCULATOR_STATE_KEY,
      JSON.stringify(withLegalReturnPath(state))
    );
    sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
  } catch {
    // Ignore storage errors
  }
};

export const clearRatesCalculatorLegalReturnFlag = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
};

export const finalizeRatesCalculatorLegalReturnState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RATES_CALCULATOR_STATE_KEY);
  localStorage.removeItem(RATES_CALCULATOR_STATE_KEY);
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

/** Read home express legal return state without clearing (safe for React Strict Mode). */
export const peekExpressHomeLegalReturnState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const sessionRaw = sessionStorage.getItem(EXPRESS_HOME_LEGAL_SESSION_KEY);
    const localRaw = localStorage.getItem(EXPRESS_HOME_FORM_KEY);
    const raw = sessionRaw || localRaw;
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

/** Same as peek, but only when the user is returning from a legal policy page. */
export const peekExpressHomeLegalReturnStateIfReturning =
  (): Record<string, any> | null => {
    if (typeof window === "undefined") return null;
    if (!sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY)) return null;
    return peekExpressHomeLegalReturnState();
  };

export const isReturningFromLegalPage = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY));
};

export const clearExpressHomeLegalReturnState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
};

/** Remove persisted express home form payload after a successful restore. */
export const finalizeExpressHomeLegalReturnState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EXPRESS_HOME_LEGAL_SESSION_KEY);
  localStorage.removeItem(EXPRESS_HOME_FORM_KEY);
};

/** Consume home express form state when returning from legal pages */
export const consumeExpressHomeLegalReturnState = (): Record<string, any> | null => {
  const state = peekExpressHomeLegalReturnState();
  if (state) {
    clearExpressHomeLegalReturnState();
    finalizeExpressHomeLegalReturnState();
  }
  return state;
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

/** Save P2P express form state before navigating to legal pages (Terms, Privacy, etc.) */
export const setP2PLegalReturnState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(P2P_LEGAL_RETURN_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

/** Consume P2P legal return state when user returns from Terms/Privacy/etc. */
export const consumeP2PLegalReturnState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(P2P_LEGAL_RETURN_STATE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(P2P_LEGAL_RETURN_STATE_KEY);
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    sessionStorage.removeItem(P2P_LEGAL_RETURN_STATE_KEY);
    return null;
  }
};


/** Save swap form state before navigating to legal pages (Terms, Privacy, etc.) */
export const setSwapLegalReturnState = (state: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SWAP_LEGAL_RETURN_STATE_KEY,
      JSON.stringify(withLegalReturnPath(state))
    );
    sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
  } catch {
    // Ignore storage errors
  }
};

/** Read swap legal return state without clearing (safe for React Strict Mode). */
export const peekSwapLegalReturnState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SWAP_LEGAL_RETURN_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

export const clearSwapLegalReturnState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
};

export const finalizeSwapLegalReturnState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SWAP_LEGAL_RETURN_STATE_KEY);
};

/** Consume swap legal return state when user returns from Terms/Privacy/etc. */
export const consumeSwapLegalReturnState = (): Record<string, any> | null => {
  const state = peekSwapLegalReturnState();
  if (state) {
    clearSwapLegalReturnState();
    finalizeSwapLegalReturnState();
  }
  return state;
};

