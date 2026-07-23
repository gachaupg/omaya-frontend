"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";
import {
  fetchDeviceSessions,
  setDeviceSessionsFromRealtime,
} from "@/features/settings/slices/settingsSlice";
import type { DeviceSession } from "@/features/settings/types";
import {
  evaluateDeviceSessionRevocation,
  extractLoggedOutSessionId,
  isRemoteLogoutForThisDevice,
  pickCurrentDeviceSession,
} from "@/features/settings/utils/deviceSessionRevocation";
import {
  clearLoginBootstrap,
  isWithinLoginBootstrap,
  persistCurrentDeviceSessionId,
  resetDeviceSessionTrackingForLogin,
} from "@/features/settings/utils/deviceSessionStorage";
import { performRemoteSessionLogout } from "@/features/settings/utils/performRemoteSessionLogout";
import { ensureDeviceSessionForBrowser } from "@/features/settings/utils/ensureDeviceSession";

const RECONNECT_MS = 10_000;
const MAX_RECONNECTS = 12;
const MAX_MESSAGE_LOG_LEN = 4000;
const TAG = "[device-sessions-ws]";
const IS_DEV = process.env.NODE_ENV === "development";

/** WebSocket may close with auth/session invalidation after remote sign-out */
const SESSION_INVALID_WS_CLOSE_CODES = new Set([4001, 4003, 4401, 4403, 1008]);

function clearDevSocketExpose() {
  if (!IS_DEV || typeof window === "undefined") return;
  try {
    delete (window as unknown as { __OMAYA_DEVICE_SESSIONS_WS__?: WebSocket })
      .__OMAYA_DEVICE_SESSIONS_WS__;
  } catch {
    // ignore
  }
}

function redactSessionUrl(full: string): string {
  try {
    const u = new URL(full);
    if (u.searchParams.has("token")) {
      u.searchParams.set("token", "[REDACTED]");
    }
    return u.toString();
  } catch {
    return full.replace(/([?&])token=[^&]*/gi, "$1token=[REDACTED]");
  }
}

function formatWsMessageData(
  raw: string
): { kind: "json"; value: unknown } | { kind: "text"; value: string } {
  if (raw.length > MAX_MESSAGE_LOG_LEN) {
    return {
      kind: "text",
      value: `${raw.slice(0, MAX_MESSAGE_LOG_LEN)}…[truncated ${raw.length} chars]`,
    };
  }
  try {
    return { kind: "json", value: JSON.parse(raw) as unknown };
  } catch {
    return { kind: "text", value: raw };
  }
}

function getAccessToken(accessFromStore?: string | null): string | null {
  if (accessFromStore && String(accessFromStore).trim()) {
    return String(accessFromStore).trim();
  }
  const cookieToken = cookieUtils.getCookie("access_token");
  if (cookieToken) return cookieToken.trim();
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("access_token");
    if (local) return local.trim();
  }
  return null;
}

type DevicesUpdateMessage = {
  type?: string;
  devices?: unknown[];
  logged_out_session_id?: string;
  session_id?: string;
  data?: { logged_out_session_id?: string };
};

function normalizeWsDevice(raw: unknown): DeviceSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  const session_id = String(o.session_id ?? "").trim();
  const ip_address = String(o.ip_address ?? "").trim();
  const location = String(o.location ?? "Unknown").trim() || "Unknown";
  const description =
    typeof o.description === "string" ? o.description.trim() : undefined;
  const browser =
    String(o.browser ?? description ?? "Unknown").trim() || "Unknown";
  const sign_in_time = String(o.sign_in_time ?? "").trim();
  const is_active = o.is_active !== false;
  const is_current =
    typeof o.is_current === "boolean" ? o.is_current : undefined;
  const last_activity =
    typeof o.last_activity === "string" ? o.last_activity : undefined;

  const fp = o.fingerprint_data;
  const user_agent =
    typeof o.user_agent === "string"
      ? o.user_agent
      : fp &&
          typeof fp === "object" &&
          typeof (fp as Record<string, unknown>).user_agent === "string"
        ? String((fp as Record<string, unknown>).user_agent)
        : undefined;

  const dd = o.device_data;
  const device_type =
    typeof o.device_type === "string"
      ? o.device_type
      : dd &&
          typeof dd === "object" &&
          typeof (dd as Record<string, unknown>).device_type === "string"
        ? String((dd as Record<string, unknown>).device_type)
        : undefined;

  if (!session_id) return null;
  if (!Number.isFinite(id) && !sign_in_time && !ip_address) return null;

  return {
    id: Number.isFinite(id) ? id : 0,
    session_id,
    ip_address: ip_address || "—",
    location,
    browser,
    sign_in_time: sign_in_time || new Date().toISOString(),
    is_active,
    description,
    last_activity,
    is_current,
    user_agent,
    device_type,
  };
}

function normalizeDevicesPayload(devices: unknown): DeviceSession[] {
  if (!Array.isArray(devices)) return [];
  const out: DeviceSession[] = [];
  for (const item of devices) {
    const row = normalizeWsDevice(item);
    if (row) out.push(row);
  }
  return out;
}

/**
 * Subscribes to `wss://…/ws/session/?token=…`, keeps device sessions in Redux, and
 * signs this browser out when the current session is revoked from another device.
 */
export function useDeviceSessionsWebSocket(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const accessToken = useSelector((s: RootState) => s.auth.tokens?.access);
  const deviceSessions = useSelector(
    (s: RootState) => s.settings.deviceSessions
  );
  const deviceSessionsLoading = useSelector(
    (s: RootState) => s.settings.deviceSessionsLoading
  );

  const reconnectsRef = useRef(0);
  const hadKnownCurrentSessionRef = useRef(false);
  const exitingRef = useRef(false);
  const ensuringSessionRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);
  const deviceSessionsRef = useRef(deviceSessions);
  const [sessionBootstrapReady, setSessionBootstrapReady] = useState(false);

  deviceSessionsRef.current = deviceSessions;

  const runRevocationCheck = useCallback(
    (sessions: DeviceSession[]) => {
      if (exitingRef.current || !isAuthenticated) return;
      if (isWithinLoginBootstrap()) return;

      const result = evaluateDeviceSessionRevocation(
        sessions,
        hadKnownCurrentSessionRef.current
      );

      if (result.trackCurrent?.session_id) {
        hadKnownCurrentSessionRef.current = true;
        persistCurrentDeviceSessionId(result.trackCurrent.session_id);
        clearLoginBootstrap();
      }

      if (result.shouldLogout) {
        exitingRef.current = true;
        performRemoteSessionLogout(dispatch, result.message);
      }
    },
    [dispatch, isAuthenticated]
  );

  const handleExplicitRemoteLogout = useCallback(
    (parsed: Record<string, unknown>, sessionsHint: DeviceSession[]) => {
      if (exitingRef.current || !isAuthenticated) return false;

      const loggedOutId = extractLoggedOutSessionId(parsed);
      if (!loggedOutId) return false;

      if (!isRemoteLogoutForThisDevice(loggedOutId, sessionsHint)) {
        return false;
      }

      exitingRef.current = true;
      performRemoteSessionLogout(
        dispatch,
        "This device was signed out from another device."
      );
      return true;
    },
    [dispatch, isAuthenticated]
  );

  // Fresh login: clear stale session id, fetch list, create session if missing
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      exitingRef.current = false;
      hadKnownCurrentSessionRef.current = false;
      ensuringSessionRef.current = false;
      wasAuthenticatedRef.current = false;
      setSessionBootstrapReady(false);
      return;
    }

    const justLoggedIn = !wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = true;

    if (justLoggedIn) {
      resetDeviceSessionTrackingForLogin();
      hadKnownCurrentSessionRef.current = false;
    }

    let cancelled = false;

    (async () => {
      let sessions: DeviceSession[] = [];
      try {
        const data = await dispatch(fetchDeviceSessions()).unwrap();
        sessions = Array.isArray(data) ? data : [];
      } catch {
        /* fetch may fail briefly right after login */
      }
      if (cancelled || exitingRef.current) return;

      const current = pickCurrentDeviceSession(sessions);
      if (current?.session_id) {
        hadKnownCurrentSessionRef.current = true;
        persistCurrentDeviceSessionId(current.session_id);
        clearLoginBootstrap();
        return;
      }

      if (!ensuringSessionRef.current) {
        ensuringSessionRef.current = true;
        await ensureDeviceSessionForBrowser(dispatch, sessions);
        ensuringSessionRef.current = false;
        if (!cancelled) {
          dispatch(fetchDeviceSessions());
        }
      }
    })()
      .catch(() => {
        /* bootstrap may fail briefly right after login */
      })
      .finally(() => {
        if (!cancelled) {
          setSessionBootstrapReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isAuthenticated, dispatch]);

  // Re-check when REST updates Redux (e.g. after initial fetch / session create)
  useEffect(() => {
    if (!enabled || !isAuthenticated || deviceSessionsLoading) return;

    if (
      deviceSessions.length === 0 &&
      !ensuringSessionRef.current &&
      isWithinLoginBootstrap()
    ) {
      ensuringSessionRef.current = true;
      void ensureDeviceSessionForBrowser(dispatch, []).finally(() => {
        ensuringSessionRef.current = false;
        dispatch(fetchDeviceSessions());
      });
      return;
    }

    runRevocationCheck(deviceSessions);
  }, [
    deviceSessions,
    deviceSessionsLoading,
    enabled,
    isAuthenticated,
    runRevocationCheck,
    dispatch,
  ]);

  useEffect(() => {
    const tokenPreview = getAccessToken(accessToken);
        if (!enabled || !isAuthenticated || !sessionBootstrapReady) {
      reconnectsRef.current = 0;
      if (!enabled) {
              } else if (!isAuthenticated) {
              } else if (!sessionBootstrapReady) {
              }
      return;
    }

    reconnectsRef.current = 0;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const safeClose = (reason: string) => {
      clearReconnect();
      if (ws) {
        const urlLogged = ws.url ? redactSessionUrl(ws.url) : undefined;
                clearDevSocketExpose();
        try {
          ws.close(1000, "client");
        } catch {
          // ignore
        }
        ws = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled || exitingRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (reconnectsRef.current >= MAX_RECONNECTS) {
                logger.warn("device-sessions-ws", "max reconnect attempts");
        return;
      }
      reconnectsRef.current += 1;
            reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectIfNeeded();
      }, RECONNECT_MS);
    };

    const connectIfNeeded = () => {
      if (cancelled || exitingRef.current) return;
      if (document.visibilityState !== "visible") {
                return;
      }

      const token = getAccessToken(accessToken);
      if (!token || !token.includes(".")) {
                return;
      }

      if (
        ws &&
        (ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING)
      ) {
                return;
      }

      safeClose("reconnect_replace_socket");

      const url = API_CONFIG.AUTH.DEVICE_SESSIONS_WS(token);
      const urlLogged = redactSessionUrl(url);

            try {
        ws = new WebSocket(url);
      } catch (e) {
                logger.error("device-sessions-ws", "WebSocket construct failed", e);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectsRef.current = 0;
        if (IS_DEV && typeof window !== "undefined" && ws) {
          (
            window as unknown as { __OMAYA_DEVICE_SESSIONS_WS__: WebSocket }
          ).__OMAYA_DEVICE_SESSIONS_WS__ = ws;
        }
                        logger.debug("device-sessions-ws", "open");
      };

      ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
        if (typeof event.data === "string") {
          const formatted = formatWsMessageData(event.data);
                  } else {
                  }

        try {
          const parsed = JSON.parse(String(event.data)) as DevicesUpdateMessage &
            Record<string, unknown>;

          if (
            handleExplicitRemoteLogout(
              parsed,
              parsed.devices
                ? normalizeDevicesPayload(parsed.devices)
                : deviceSessionsRef.current
            )
          ) {
            return;
          }

          if (parsed?.type === "devices_update" && parsed.devices) {
            const next = normalizeDevicesPayload(parsed.devices);
            dispatch(setDeviceSessionsFromRealtime(next));
            logger.debug("device-sessions-ws", "devices_update", {
              count: next.length,
            });
            runRevocationCheck(next);
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = (ev) => {
                logger.warn("device-sessions-ws", "error event");
      };

      ws.onclose = (event) => {
        clearDevSocketExpose();
        ws = null;
                logger.warn("device-sessions-ws", "close", {
          code: event.code,
          reason: event.reason || undefined,
          wasClean: event.wasClean,
        });

        if (cancelled) return;

        if (
          hadKnownCurrentSessionRef.current &&
          SESSION_INVALID_WS_CLOSE_CODES.has(event.code)
        ) {
          exitingRef.current = true;
          performRemoteSessionLogout(
            dispatch,
            "Your session ended. Please sign in again."
          );
          return;
        }

        if (document.visibilityState !== "visible") return;
        scheduleReconnect();
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        reconnectsRef.current = 0;
        safeClose("visibility_hidden");
              } else {
        reconnectsRef.current = 0;
                connectIfNeeded();
      }
    };

    const onPageHide = () => {
      reconnectsRef.current = 0;
      safeClose("pagehide");
          };

    const onWindowOffline = () => {
      reconnectsRef.current = 0;
      safeClose("browser_offline");
          };

    const onWindowOnline = () => {
      reconnectsRef.current = 0;
            connectIfNeeded();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("offline", onWindowOffline);
    window.addEventListener("online", onWindowOnline);

    connectIfNeeded();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("offline", onWindowOffline);
      window.removeEventListener("online", onWindowOnline);
      safeClose("effect_cleanup_logout_or_unmount");
      clearDevSocketExpose();
          };
  }, [
    enabled,
    isAuthenticated,
    sessionBootstrapReady,
    accessToken,
    dispatch,
    handleExplicitRemoteLogout,
    runRevocationCheck,
  ]);
}
