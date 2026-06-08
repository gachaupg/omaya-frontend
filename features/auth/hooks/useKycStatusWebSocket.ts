"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { API_CONFIG } from "@/lib/appConfig";
import {
  applyKycStatusUpdate,
  checkKYCStatus,
} from "@/features/auth/slices/authSlice";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";
import type { KYCResponse } from "@/features/auth/types";

const RECONNECT_MS = 10_000;
const MAX_RECONNECTS = 12;

type KycStatusMessage = {
  type?: string;
  data?: Partial<KYCResponse>;
};

/**
 * Subscribes to `wss://…/ws/kyc-status/?token=…` and applies
 * `{ type: "kyc_status_update", data: { … } }` to Redux so KYC UI
 * updates when admin approves/rejects without a manual refresh.
 */
export function useKycStatusWebSocket(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const accessToken = useSelector((s: RootState) => s.auth.tokens?.access);

  const reconnectsRef = useRef(0);
  const initialFetchRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      reconnectsRef.current = 0;
      initialFetchRef.current = false;
      return;
    }

    const token =
      accessToken ||
      cookieUtils.getCookie("access_token") ||
      (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

    if (!token || !String(token).includes(".")) {
      return;
    }

    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      dispatch(checkKYCStatus(true));
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

      const url = API_CONFIG.AUTH.KYC_STATUS_WS(token);
      try {
        ws = new WebSocket(url);
      } catch (e) {
        logger.error("kyc-status-ws", "WebSocket construct failed", e);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectsRef.current = 0;
        logger.debug("kyc-status-ws", "open");
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as KycStatusMessage & KYCResponse;
          const type = String(parsed?.type || "").trim();

          if (type === "kyc_status_update" && parsed.data && typeof parsed.data === "object") {
            dispatch(applyKycStatusUpdate(parsed.data));
            logger.debug("kyc-status-ws", "kyc_status_update", parsed.data);
            return;
          }

          // Some backends may send the status payload without a `data` wrapper.
          if (
            !type &&
            (typeof parsed.is_verified === "boolean" || typeof parsed.status === "string")
          ) {
            dispatch(applyKycStatusUpdate(parsed));
            logger.debug("kyc-status-ws", "kyc_status_payload", parsed);
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        logger.warn("kyc-status-ws", "error event");
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
        logger.warn("kyc-status-ws", "max reconnect attempts");
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
