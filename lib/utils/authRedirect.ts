"use client";

const AUTH_REDIRECT_KEY = "auth_redirect";

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

