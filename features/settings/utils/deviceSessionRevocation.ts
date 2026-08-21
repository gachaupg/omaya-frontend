import type { DeviceSession } from "../types";
import {
  getPersistedDeviceSessionId,
  persistCurrentDeviceSessionId,
} from "./deviceSessionStorage";

function isValidDeviceSession(value: unknown): value is DeviceSession {
  if (!value || typeof value !== "object") return false;
  const row = value as DeviceSession;
  return Boolean(String(row.session_id ?? "").trim());
}

/** Drop null/undefined or malformed rows from API / WS / Redux lists. */
export function sanitizeDeviceSessions(
  sessions: DeviceSession[] | null | undefined
): DeviceSession[] {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter(isValidDeviceSession);
}

/** Normalize device session list from API / thunk payloads. */
export function parseDeviceSessionsResponse(raw: unknown): DeviceSession[] {
  if (Array.isArray(raw)) {
    return sanitizeDeviceSessions(raw as DeviceSession[]);
  }
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  for (const key of ["data", "results", "sessions", "devices"] as const) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return sanitizeDeviceSessions(nested as DeviceSession[]);
    }
  }
  return [];
}

/** Some backends return 404/400 when no sessions remain after logout-all. */
export function isBenignEmptySessionsFetchError(error: unknown): boolean {
  const err = error as {
    response?: { status?: number; data?: Record<string, unknown> };
  };
  const status = err?.response?.status;
  if (status === 404 || status === 204) return true;

  const data = err?.response?.data;
  const message = String(
    data?.message ?? data?.detail ?? data?.error ?? ""
  ).toLowerCase();
  if (!message) return false;

  return (
    message.includes("no session") ||
    message.includes("no device") ||
    message.includes("not found") ||
    message.includes("no active")
  );
}

export function pickCurrentDeviceSession(
  sessions: DeviceSession[]
): DeviceSession | undefined {
  const active = sanitizeDeviceSessions(sessions).filter(
    (s) => s.is_active !== false
  );
  const explicit = active.find((s) => s.is_current === true);
  if (explicit) return explicit;

  const persisted = getPersistedDeviceSessionId();
  if (persisted) {
    return active.find((s) => s.session_id === persisted);
  }

  if (active.length === 1) {
    return active[0];
  }

  return undefined;
}

export function isDeviceSessionStillActive(
  sessionId: string,
  sessions: DeviceSession[]
): boolean {
  const row = sanitizeDeviceSessions(sessions).find(
    (s) => s.session_id === sessionId
  );
  if (!row) return false;
  return row.is_active !== false;
}

export type SessionRevocationCheck = {
  shouldLogout: boolean;
  message?: string;
  /** Call after a successful check to remember the current session id */
  trackCurrent?: DeviceSession;
};

/**
 * Returns whether this browser should sign out based on the latest device list.
 */
export function evaluateDeviceSessionRevocation(
  sessions: DeviceSession[],
  hadKnownCurrentSession: boolean
): SessionRevocationCheck {
  const safeSessions = sanitizeDeviceSessions(sessions);
  const current = pickCurrentDeviceSession(safeSessions);
  if (current?.session_id) {
    return { shouldLogout: false, trackCurrent: current };
  }

  const persisted = getPersistedDeviceSessionId();
  if (hadKnownCurrentSession && persisted) {
    if (!isDeviceSessionStillActive(persisted, safeSessions)) {
      return {
        shouldLogout: true,
        message: "This device was signed out from another device.",
      };
    }
  }

  if (hadKnownCurrentSession && safeSessions.length === 0) {
    return {
      shouldLogout: true,
      message: "Your session ended. Please sign in again.",
    };
  }

  return { shouldLogout: false };
}

export function extractLoggedOutSessionId(
  parsed: Record<string, unknown>
): string | null {
  const direct = parsed.logged_out_session_id;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const data = parsed.data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).logged_out_session_id;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }

  const sessionId = parsed.session_id;
  if (
    typeof sessionId === "string" &&
    sessionId.trim() &&
    (parsed.type === "session_logout" ||
      parsed.type === "device_logged_out" ||
      parsed.type === "session_revoked")
  ) {
    return sessionId.trim();
  }

  return null;
}

export function isRemoteLogoutForThisDevice(
  loggedOutSessionId: string,
  sessions: DeviceSession[]
): boolean {
  const safeSessions = sanitizeDeviceSessions(sessions);
  const persisted = getPersistedDeviceSessionId();
  if (persisted && persisted === loggedOutSessionId) return true;

  const current = pickCurrentDeviceSession(safeSessions);
  if (current?.session_id === loggedOutSessionId) return true;

  return false;
}

export function trackDeviceSessionList(sessions: DeviceSession[]): boolean {
  const current = pickCurrentDeviceSession(sessions);
  if (current?.session_id) {
    persistCurrentDeviceSessionId(current.session_id);
    return true;
  }
  return false;
}
