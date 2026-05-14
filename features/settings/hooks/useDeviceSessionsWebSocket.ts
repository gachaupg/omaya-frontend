"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";
import { setDeviceSessionsFromRealtime } from "@/features/settings/slices/settingsSlice";
import type { DeviceSession } from "@/features/settings/types";

const RECONNECT_MS = 10_000;
const MAX_RECONNECTS = 12;

type DevicesUpdateMessage = {
  type?: string;
  devices?: unknown[];
};

function normalizeWsDevice(raw: unknown): DeviceSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  const session_id = String(o.session_id ?? "").trim();
  const ip_address = String(o.ip_address ?? "").trim();
  const location = String(o.location ?? "").trim();
  const description =
    typeof o.description === "string" ? o.description.trim() : undefined;
  const browser = String(o.browser ?? description ?? "").trim();
  const sign_in_time = String(o.sign_in_time ?? "").trim();
  const is_active = Boolean(o.is_active);
  const is_current =
    typeof o.is_current === "boolean" ? o.is_current : undefined;
  const last_activity =
    typeof o.last_activity === "string" ? o.last_activity : undefined;

  const fp = o.fingerprint_data;
  const user_agent =
    typeof o.user_agent === "string"
      ? o.user_agent
      : fp && typeof fp === "object" && typeof (fp as Record<string, unknown>).user_agent === "string"
        ? String((fp as Record<string, unknown>).user_agent)
        : undefined;

  const dd = o.device_data;
  const device_type =
    typeof o.device_type === "string"
      ? o.device_type
      : dd && typeof dd === "object" && typeof (dd as Record<string, unknown>).device_type === "string"
        ? String((dd as Record<string, unknown>).device_type)
        : undefined;

  if (!Number.isFinite(id) || !session_id || !sign_in_time || !ip_address) {
    return null;
  }
  if (!location || !browser) {
    return null;
  }

  return {
    id,
    session_id,
    ip_address,
    location,
    browser,
    sign_in_time,
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
 * Subscribes to `wss://…/ws/session/?token=…` and applies
 * `{ type: "devices_update", devices: [...] }` to Redux so Privacy & Security (and anywhere else
 * using `deviceSessions`) stays in sync when sessions change on the server.
 */
export function useDeviceSessionsWebSocket(options?: { enabled?: boolean }) {
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

      const url = API_CONFIG.AUTH.DEVICE_SESSIONS_WS(token);
      try {
        ws = new WebSocket(url);
      } catch (e) {
        logger.error("device-sessions-ws", "WebSocket construct failed", e);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectsRef.current = 0;
        logger.debug("device-sessions-ws", "open");
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as DevicesUpdateMessage;
          if (parsed?.type === "devices_update" && parsed.devices) {
            const next = normalizeDevicesPayload(parsed.devices);
            dispatch(setDeviceSessionsFromRealtime(next));
            logger.debug("device-sessions-ws", "devices_update", { count: next.length });
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        logger.warn("device-sessions-ws", "error event");
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
        logger.warn("device-sessions-ws", "max reconnect attempts");
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
      if (ws) {
        ws.close();
      }
      ws = null;
    };
  }, [enabled, isAuthenticated, accessToken, dispatch]);
}
