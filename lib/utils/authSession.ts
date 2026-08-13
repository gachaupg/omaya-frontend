import { cookieUtils } from "./cookieUtils";
import { storage } from "@/features/auth/utils/storage";

const AUTH_BOUNCE_KEY = "omaya_auth_bounce";
const DEFAULT_ACCESS_COOKIE_MAX_AGE_SEC = 60 * 60;

export interface AuthTokenPair {
  access: string;
  refresh: string;
}

/** Keep profile, localStorage keys, and middleware cookie in sync after refresh/login. */
export function persistRefreshedTokens(tokens: AuthTokenPair): void {
  if (typeof window === "undefined") return;

  const existing = storage.getProfile();
  if (existing) {
    storage.setProfile({
      ...existing,
      tokens,
    });
  }

  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
  setMiddlewareAccessTokenCookie(tokens.access, 86400);
}

export function isSecureCookieContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

/** Same-origin access_token cookie for Next.js middleware (Lax; Secure only on HTTPS). */
export function setMiddlewareAccessTokenCookie(
  token: string,
  maxAgeSec = DEFAULT_ACCESS_COOKIE_MAX_AGE_SEC
): void {
  cookieUtils.setCookie("access_token", token, {
    maxAge: maxAgeSec,
    secure: isSecureCookieContext(),
    sameSite: "lax",
  });
}

export function clearMiddlewareAccessTokenCookie(): void {
  cookieUtils.removeCookie("access_token");
}

/** Remove client auth keys without wiping unrelated localStorage (e.g. p2p_act). */
export function clearStoredAuthCredentials(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("profile");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_email");
  localStorage.removeItem("kyc_status");

  clearMiddlewareAccessTokenCookie();
}

export function clearAuthRedirectBounceGuard(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_BOUNCE_KEY);
  } catch {
    /* no-op */
  }
}

/**
 * Hard-navigate for auth flows with loop protection.
 * If the same from→to bounce happens twice in a row, clear stale credentials and stop.
 */
export function authHardRedirect(to: string): void {
  if (typeof window === "undefined") return;

  const from = `${window.location.pathname}${window.location.search || ""}`;
  const fingerprint = `${from}->${to}`;

  try {
    const previous = sessionStorage.getItem(AUTH_BOUNCE_KEY);
    if (previous === fingerprint) {
      sessionStorage.removeItem(AUTH_BOUNCE_KEY);
      clearStoredAuthCredentials();
            return;
    }
    sessionStorage.setItem(AUTH_BOUNCE_KEY, fingerprint);
  } catch {
    /* continue with redirect */
  }

  window.location.href = to;
}
