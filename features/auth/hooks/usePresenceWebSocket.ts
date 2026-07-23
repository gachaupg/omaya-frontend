"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";

const RECONNECT_MS = 10_000;
const MAX_RECONNECTS = 12;
const MAX_MESSAGE_LOG_LEN = 4000;
const TAG = "[presence-ws]";
const IS_DEV = process.env.NODE_ENV === "development";

function clearDevSocketExpose() {
  if (!IS_DEV || typeof window === "undefined") return;
  try {
    delete (window as unknown as { __OMAYA_PRESENCE_WS__?: WebSocket }).__OMAYA_PRESENCE_WS__;
  } catch {
    // ignore
  }
}

function redactPresenceUrl(full: string): string {
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

function formatWsMessageData(raw: string): { kind: "json"; value: unknown } | { kind: "text"; value: string } {
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

/**
 * Global presence WebSocket (backend contract):
 *   `wss://<API>/ws/presence/?token=<JWT>`
 *
 * - **Connect** (tab visible + authenticated) → server marks user **online**
 * - **Disconnect** (tab hide, navigate away, close tab, logout, offline) → server marks **offline**
 *
 * The live socket always uses the real JWT in the query string. Log output uses a
 * **redacted** URL only so tokens never appear in logs.
 *
 * **Chrome:** DevTools → **Network** → reload page → filter box type `presence` OR set type
 * filter to **WS** / **Socket** → click the `ws/presence/` row → **Messages** (frames).
 */
export function usePresenceWebSocket(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const accessToken = useSelector((s: RootState) => s.auth.tokens?.access);

  const reconnectsRef = useRef(0);

  useEffect(() => {
    const tokenPreview = getAccessToken(accessToken);
        if (!enabled || !isAuthenticated) {
      reconnectsRef.current = 0;
      if (!enabled) {
              } else if (!isAuthenticated) {
              }
      return;
    }

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
        const rs = ws.readyState;
        const urlSafe = ws.url ? redactPresenceUrl(ws.url) : undefined;
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
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      if (reconnectsRef.current >= MAX_RECONNECTS) {
                return;
      }
      reconnectsRef.current += 1;
            reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectIfNeeded();
      }, RECONNECT_MS);
    };

    const connectIfNeeded = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;

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

      const url = API_CONFIG.AUTH.PRESENCE_WS(token);
      const urlLogged = redactPresenceUrl(url);

            try {
        ws = new WebSocket(url);
      } catch (e) {
                scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectsRef.current = 0;
        if (IS_DEV && typeof window !== "undefined" && ws) {
          (window as unknown as { __OMAYA_PRESENCE_WS__: WebSocket }).__OMAYA_PRESENCE_WS__ = ws;
        }
                      };

      ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
        if (typeof event.data === "string") {
          const parsed = formatWsMessageData(event.data);
                  } else if (event.data instanceof ArrayBuffer) {
                  } else {
                  }
      };

      ws.onerror = (ev) => {
              };

      ws.onclose = (ev) => {
        clearDevSocketExpose();
        ws = null;
                if (cancelled) return;
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
  }, [enabled, isAuthenticated, accessToken]);
}
