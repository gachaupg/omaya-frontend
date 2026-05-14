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
 * The live socket always uses the real JWT in the query string. `console.log` lines use a
 * **redacted** URL only so tokens never appear in the console.
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
    console.log("[presence-ws] effect", {
      enabled,
      isAuthenticated,
      visibility:
        typeof document !== "undefined" ? document.visibilityState : "ssr",
      hasToken: !!tokenPreview,
      jwtShapeOk: !!tokenPreview && tokenPreview.includes("."),
    });

    if (!enabled || !isAuthenticated) {
      reconnectsRef.current = 0;
      if (!enabled) {
        console.log("[presence-ws] skip: hook disabled");
      } else if (!isAuthenticated) {
        console.log("[presence-ws] skip: not authenticated (wait for login / rehydrate)");
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
        console.log(TAG, {
          event: "disconnect",
          reason,
          readyStateBeforeClose: rs,
          url: urlSafe,
          backend: "user should be marked OFFLINE after socket closes",
        });
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
        console.log(TAG, {
          event: "reconnect_aborted",
          reason: "max_attempts",
          attempts: reconnectsRef.current,
        });
        return;
      }
      reconnectsRef.current += 1;
      console.log(TAG, {
        event: "reconnect_scheduled",
        attempt: reconnectsRef.current,
        delayMs: RECONNECT_MS,
      });
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
        console.log(TAG, {
          event: "connect_skipped",
          reason: "no_valid_jwt",
        });
        return;
      }

      if (
        ws &&
        (ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING)
      ) {
        console.log(TAG, {
          event: "connect_skipped",
          reason: "already_open_or_connecting",
          readyState: ws.readyState,
        });
        return;
      }

      safeClose("reconnect_replace_socket");

      const url = API_CONFIG.AUTH.PRESENCE_WS(token);
      const urlLogged = redactPresenceUrl(url);

      console.log(TAG, {
        event: "connecting",
        url: urlLogged,
        note: "Real JWT is used for new WebSocket() — token redacted here only",
        visibility: document.visibilityState,
        backend: "server will mark ONLINE after handshake",
      });

      try {
        ws = new WebSocket(url);
      } catch (e) {
        console.log(TAG, {
          event: "construct_failed",
          url: urlLogged,
          error: String(e),
        });
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectsRef.current = 0;
        if (IS_DEV && typeof window !== "undefined" && ws) {
          (window as unknown as { __OMAYA_PRESENCE_WS__: WebSocket }).__OMAYA_PRESENCE_WS__ = ws;
        }
        console.log(TAG, {
          event: "open",
          url: urlLogged,
          readyState: ws?.readyState,
          extensions: ws?.extensions || "",
          protocol: ws?.protocol || "",
          backend: "user should be marked ONLINE",
        });
        console.log(
          TAG,
          "Inspect socket in Chrome: F12 → Network → (All) reload page → filter “presence” OR column Type = websocket → click row → “Messages” tab for frames. Dev: window.__OMAYA_PRESENCE_WS__"
        );
      };

      ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
        if (typeof event.data === "string") {
          const parsed = formatWsMessageData(event.data);
          console.log(TAG, {
            event: "message",
            ...parsed,
          });
        } else if (event.data instanceof ArrayBuffer) {
          console.log(TAG, {
            event: "message",
            kind: "arraybuffer",
            byteLength: event.data.byteLength,
          });
        } else {
          console.log(TAG, { event: "message", kind: "other", value: String(event.data) });
        }
      };

      ws.onerror = (ev) => {
        console.log(TAG, {
          event: "ws_error_event",
          url: urlLogged,
          type: ev.type,
          readyState: ws?.readyState,
        });
      };

      ws.onclose = (ev) => {
        clearDevSocketExpose();
        ws = null;
        console.log(TAG, {
          event: "close",
          code: ev.code,
          reason: ev.reason || "(empty)",
          wasClean: ev.wasClean,
          url: urlLogged,
          backend: "user should be marked OFFLINE (unless reconnecting while tab visible)",
        });
        if (cancelled) return;
        if (document.visibilityState !== "visible") return;
        scheduleReconnect();
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        reconnectsRef.current = 0;
        safeClose("visibility_hidden");
        console.log(TAG, { event: "lifecycle", action: "tab_hidden" });
      } else {
        reconnectsRef.current = 0;
        console.log(TAG, { event: "lifecycle", action: "tab_visible" });
        connectIfNeeded();
      }
    };

    const onPageHide = () => {
      reconnectsRef.current = 0;
      safeClose("pagehide");
      console.log(TAG, { event: "lifecycle", action: "pagehide" });
    };

    const onWindowOffline = () => {
      reconnectsRef.current = 0;
      safeClose("browser_offline");
      console.log(TAG, { event: "lifecycle", action: "browser_offline" });
    };

    const onWindowOnline = () => {
      reconnectsRef.current = 0;
      console.log(TAG, { event: "lifecycle", action: "browser_online" });
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
      console.log(TAG, { event: "lifecycle", action: "hook_cleanup" });
    };
  }, [enabled, isAuthenticated, accessToken]);
}
