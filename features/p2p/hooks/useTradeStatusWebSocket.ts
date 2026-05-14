/**
 * WebSocket hook for real-time trade status updates (matched, half-matched, completed, cancelled).
 * Used by: TradeBuyOwner, TradeSellerOwner, sellform, buyform.
 * The callback is stored in a ref so the effect only depends on tradeId/enabled—avoids reconnect
 * loops when the parent re-renders after a status update (which would otherwise change the callback reference).
 */
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  getTradeStatusWebSocket,
  cleanupTradeStatusWebSocket,
  TradeStatus,
} from "../services/tradeStatusWebSocket";
import type { WebSocketMessage } from "../services/tradeStatusWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

import { logger } from '@/lib/utils/logger';
import { normalizeP2PTradeStatus } from "../utils/normalizeP2PTradeStatus";
import { P2P_TRADE_CANCELED_EVENT } from "../constants/tradeSocketEvents";

interface UseTradeStatusWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
  onStatusUpdate?: (status: TradeStatus) => void;
}

export const useTradeStatusWebSocket = (options: UseTradeStatusWebSocketOptions) => {
  const { tradeId, enabled = true, onStatusUpdate } = options;
  const dispatch = useDispatch<AppDispatch>();
  const mountedRef = useRef(true);
  const cancelEventFiredRef = useRef(false);
  // Keep latest callback in a ref so effect only depends on tradeId/enabled (avoids reconnect loops when callback reference changes)
  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

    // Always use the socket for *this* tradeId — a ref initialized with the first tradeId would leak the previous trade's connection after navigation.
    const ws = getTradeStatusWebSocket(tradeId);

    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        const msgAny = message as Record<string, unknown>;
        console.log("[P2P trade-status WS] handler tradeId=%s payload=", tradeId, msgAny);

        switch (message.type) {
          case "connection_established":
            logger.debug('p2p', "✅ Trade status connection established");
            break;

          case "status_update":
          case "trade_update": {
            const data = message.data || message;
            if (data && data.status) {
              const normalized = normalizeP2PTradeStatus(String(data.status));
              const tradeStatus: TradeStatus = {
                id: data.id || data.trade_id || tradeId,
                status: (normalized ?? data.status) as TradeStatus["status"],
                amount: data.amount,
                buyer: data.buyer || data.buyer_id,
                seller: data.seller || data.seller_id,
                ...data,
              };
              const payloadTradeId = (data as { trade_id?: string; tradeId?: string }).trade_id
                ?? (data as { tradeId?: string }).tradeId;
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
                console.log("[P2P trade-status WS] trade canceled → event", {
                  tradeId,
                  detailMsg,
                });
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
              const cb = onStatusUpdateRef.current;
              if (cb) cb(tradeStatus);
              else console.warn("⚠️ onStatusUpdate callback not provided!");
            } else {
              console.warn("⚠️ Status update missing 'status' field:", message);
            }
            break;
          }

          case "error":
            console.warn("⚠️ Trade status error:", message.data || message);
            break;

          default:
            logger.debug('p2p', "📨 Unknown message type:", message);
            break;
        }
      } catch (error) {
        console.error("❌ Error handling trade status message:", error);
      }
    });

    // Handle WebSocket errors
    const unsubscribeError = ws.onError((error) => {
      console.warn("⚠️ Trade status WebSocket error:", error);
    });

    // Handle WebSocket close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      logger.debug('p2p', "🔌 Trade status WebSocket closed");
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      logger.debug('p2p', "🔓 Trade status WebSocket opened");
    });

    // Connect to WebSocket
    ws.connect(tradeId, token);

    // Cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeClose();
      unsubscribeOpen();
      cleanupTradeStatusWebSocket(tradeId);
    };
  }, [enabled, tradeId]);

  return {
    isConnected:
      Boolean(enabled && tradeId?.trim()) && getTradeStatusWebSocket(tradeId).isConnected(),
  };
};

