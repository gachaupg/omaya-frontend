"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { API_CONFIG } from "@/lib/appConfig";
import { updateUser } from "@/features/auth/slices/authSlice";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";

const RECONNECT_MS = 10_000;
const MAX_RECONNECTS = 12;

type FreezeStatusMessage = {
  type?: string;
  data?: { freeze?: boolean; message?: string };
};

/**
 * Subscribes to `wss://…/ws/freeze-status/?token=…` and applies
 * `{ type: "freeze_status_update", data: { freeze, message } }` to Redux + persisted profile
 * so Sidebar, dashboard layout, and forms update without a new login.
 */
export function useFreezeStatusWebSocket(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const accessToken = useSelector((s: RootState) => s.auth.tokens?.access);

  const reconnectsRef = useRef(0);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      reconnectsRef.current = 0;
      return;
    }

    const token =
      accessToken ||
      cookieUtils.getCookie("access_token") ||
      (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

    if (!token || !String(token).includes(".")) {
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

    const connect = () => {
      if (cancelled) return;
      clearReconnect();

      const url = API_CONFIG.AUTH.FREEZE_STATUS_WS(token);
      try {
        ws = new WebSocket(url);
      } catch (e) {
        logger.error("freeze-status-ws", "WebSocket construct failed", e);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectsRef.current = 0;
        logger.debug("freeze-status-ws", "open");
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as FreezeStatusMessage;
          if (
            parsed?.type === "freeze_status_update" &&
            parsed.data &&
            typeof parsed.data.freeze === "boolean"
          ) {
            dispatch(updateUser({ freeze: parsed.data.freeze === true }));
            logger.debug("freeze-status-ws", "freeze_status_update", parsed.data);
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        logger.warn("freeze-status-ws", "error event");
      };

      ws.onclose = () => {
        ws = null;
        if (cancelled) return;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      if (reconnectsRef.current >= MAX_RECONNECTS) {
        logger.warn("freeze-status-ws", "max reconnect attempts");
        return;
      }
      reconnectsRef.current += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_MS);
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws) {
        ws.close();
      }
      ws = null;
    };
  }, [enabled, isAuthenticated, accessToken, dispatch]);
}
