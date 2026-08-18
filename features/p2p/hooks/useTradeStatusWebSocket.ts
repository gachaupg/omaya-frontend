/**
 * WebSocket hook for real-time trade status updates (matched, half-matched, completed, cancelled).
 * Used by: TradeBuyOwner, TradeSellerOwner, sellform, buyform.
 * The callback is stored in a ref so the effect only depends on tradeId/enabled—avoids reconnect
 * loops when the parent re-renders after a status update (which would otherwise change the callback reference).
 */
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  getTradeStatusWebSocket,
  releaseTradeStatusWebSocket,
  retainTradeStatusWebSocket,
  TradeStatus,
} from "../services/tradeStatusWebSocket";
import type { WebSocketMessage } from "../services/tradeStatusWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

import { logger } from '@/lib/utils/logger';
import { normalizeP2PTradeStatus } from "../utils/normalizeP2PTradeStatus";
import { P2P_TRADE_CANCELED_EVENT } from "../constants/tradeSocketEvents";
import { API_CONFIG } from "@/lib/appConfig";
import { logP2pWebSocketUrl } from "../utils/logP2pWebSocketUrl";

interface UseTradeStatusWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
  onStatusUpdate?: (status: TradeStatus) => void;
}

const applyTradeStatusPayload = (
  msgAny: Record<string, unknown>,
  tradeId: string,
  cancelEventFiredRef: MutableRefObject<boolean>,
  onStatusUpdateRef: MutableRefObject<
    UseTradeStatusWebSocketOptions["onStatusUpdate"]
  >
) => {
  const nested =
    msgAny.data && typeof msgAny.data === "object"
      ? (msgAny.data as Record<string, unknown>)
      : null;
  const data = {
    ...msgAny,
    ...(nested ?? {}),
  } as Record<string, unknown>;
  const statusRaw = data.status ?? msgAny.status ?? nested?.status;
  if (statusRaw == null || String(statusRaw).trim() === "") return;

  const normalized = normalizeP2PTradeStatus(String(statusRaw));
  const tradeStatus: TradeStatus = {
    id:
      (data.id as string) ||
      (data.trade_id as string) ||
      (msgAny.trade_id as string) ||
      tradeId,
    status: (normalized ?? String(statusRaw)) as TradeStatus["status"],
    amount: data.amount as string | undefined,
    buyer: (data.buyer as string) || (data.buyer_id as string),
    seller: (data.seller as string) || (data.seller_id as string),
    ...data,
  };
  const payloadTradeId =
    (data as { trade_id?: string; tradeId?: string }).trade_id ??
    (data as { tradeId?: string }).tradeId;
  const tradeIdsAlign =
    payloadTradeId == null ||
    String(payloadTradeId).trim() === String(tradeId).trim();

  if (
    normalized === "cancelled" &&
    !cancelEventFiredRef.current &&
    tradeIdsAlign &&
    tradeId?.trim()
  ) {
    cancelEventFiredRef.current = true;
    const detailMsg =
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message
        : undefined;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(P2P_TRADE_CANCELED_EVENT, {
          detail: {
            tradeId,
            message: detailMsg,
            source: "trade-status-ws",
          },
        })
      );
    }
  }
  onStatusUpdateRef.current?.(tradeStatus);
};

export const useTradeStatusWebSocket = (options: UseTradeStatusWebSocketOptions) => {
  const { tradeId, enabled = true, onStatusUpdate } = options;
  const mountedRef = useRef(true);
  const cancelEventFiredRef = useRef(false);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(getTradeStatusWebSocket(tradeId));
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    wsRef.current = getTradeStatusWebSocket(tradeId);
    cancelEventFiredRef.current = false;
  }, [tradeId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !tradeId) return;

    heartbeatIntervalRef.current = setInterval(() => {
      const ws = wsRef.current;
      const connected = ws.isConnected();
      if (mountedRef.current) {
        setIsConnected(connected);
      }
      if (!connected && !ws.hasFailed()) {
        const cookieToken = cookieUtils.getCookie("access_token");
        const localToken =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;
        const token = cookieToken || localToken;
        if (token && token.includes(".")) {
          ws.resetPermanentFailure();
          ws.connect(tradeId, token);
        }
      }
    }, 1000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [enabled, tradeId]);

  useEffect(() => {
    logger.debug('p2p', "🔌 useTradeStatusWebSocket effect triggered:", { enabled, tradeId });

    if (!enabled || !tradeId) {
      logger.debug('p2p', "⚠️ WebSocket not enabled or no tradeId:", { enabled, tradeId });
      return;
    }

    const getAccessToken = (): string | null => {
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) return cookieToken;
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) return localToken;
      }
      return null;
    };

    const token = getAccessToken();
    if (!token || !token.includes('.')) return;

    cancelEventFiredRef.current = false;
    const ws = wsRef.current;

    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        const msgAny = message as Record<string, unknown>;
        const msgType = String(message.type ?? "").trim().toLowerCase();

        switch (msgType) {
          case "connection_established":
            logger.debug('p2p', "✅ Trade status connection established");
            setIsConnected(true);
            break;

          case "status_update":
          case "trade_update":
            applyTradeStatusPayload(
              msgAny,
              tradeId,
              cancelEventFiredRef,
              onStatusUpdateRef
            );
            setIsConnected(true);
            break;

          case "error":
            break;

          default:
            if (
              msgAny.status != null &&
              String(msgAny.status).trim() !== ""
            ) {
              applyTradeStatusPayload(
                msgAny,
                tradeId,
                cancelEventFiredRef,
                onStatusUpdateRef
              );
              setIsConnected(true);
            } else {
              logger.debug('p2p', "📨 Unknown message type:", message);
            }
            break;
        }
      } catch {
        // tolerate malformed payloads
      }
    });

    const unsubscribeError = ws.onError(() => {});

    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      logger.debug('p2p', "🔌 Trade status WebSocket closed");
    });

    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      logger.debug('p2p', "🔓 Trade status WebSocket opened");
    });

    const wsUrl = API_CONFIG.P2P.SOCKETS.TRADE_STATUS(tradeId, token);
    logP2pWebSocketUrl("trade-status-hook", wsUrl);
    retainTradeStatusWebSocket(tradeId);
    ws.connect(tradeId, token);

    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeClose();
      unsubscribeOpen();
      releaseTradeStatusWebSocket(tradeId);
    };
  }, [enabled, tradeId]);

  return {
    isConnected,
  };
};
