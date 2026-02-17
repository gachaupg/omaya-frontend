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

interface UseTradeStatusWebSocketOptions {
  tradeId: string;
  enabled?: boolean;
  onStatusUpdate?: (status: TradeStatus) => void;
}

export const useTradeStatusWebSocket = (options: UseTradeStatusWebSocketOptions) => {
  const { tradeId, enabled = true, onStatusUpdate } = options;
  const dispatch = useDispatch<AppDispatch>();
  const wsRef = useRef(getTradeStatusWebSocket(tradeId));
  const mountedRef = useRef(true);
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

    const ws = wsRef.current;

    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        switch (message.type) {
          case "connection_established":
            logger.debug('p2p', "✅ Trade status connection established");
            break;

          case "status_update":
          case "trade_update": {
            const data = message.data || message;
            if (data && data.status) {
              const tradeStatus: TradeStatus = {
                id: data.id || data.trade_id || tradeId,
                status: data.status,
                amount: data.amount,
                buyer: data.buyer || data.buyer_id,
                seller: data.seller || data.seller_id,
                ...data,
              };
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
    isConnected: wsRef.current.isConnected(),
  };
};

