const DEVICE_SESSION_ID_KEY = "omaya_current_device_session_id";
const LOGIN_BOOTSTRAP_UNTIL_KEY = "omaya_login_bootstrap_until";

/** After login, skip remote-revocation logout while sessions are being created. */
export function markLoginBootstrap(graceMs = 60_000): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LOGIN_BOOTSTRAP_UNTIL_KEY,
      String(Date.now() + graceMs)
    );
  } catch {
    /* no-op */
  }
}

export function isWithinLoginBootstrap(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LOGIN_BOOTSTRAP_UNTIL_KEY);
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

export function clearLoginBootstrap(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOGIN_BOOTSTRAP_UNTIL_KEY);
  } catch {
    /* no-op */
  }
}

/** Call on fresh login so stale device ids do not trigger immediate logout. */
export function resetDeviceSessionTrackingForLogin(): void {
  clearPersistedDeviceSessionId();
  markLoginBootstrap();
}

export function persistCurrentDeviceSessionId(sessionId: string): void {
  if (typeof window === "undefined" || !sessionId.trim()) return;
  try {
    localStorage.setItem(DEVICE_SESSION_ID_KEY, sessionId.trim());
  } catch {
    /* no-op */
  }
}

export function getPersistedDeviceSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DEVICE_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function clearPersistedDeviceSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEVICE_SESSION_ID_KEY);
    clearLoginBootstrap();
  } catch {
    /* no-op */
  }
}
