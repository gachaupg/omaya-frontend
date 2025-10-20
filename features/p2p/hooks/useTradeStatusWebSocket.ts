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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !tradeId) {
      return;
    }

    const getAccessToken = (): string | null => {
      // First try to get from cookies (primary storage)
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        return cookieToken;
      }
      
      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          return localToken;
        }
      }
      
      return null;
    };

    const token = getAccessToken();

    if (!token) {
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      return;
    }

    const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        switch (message.type) {
          case "connection_established":
            break;

          case "status_update":
          case "trade_update":
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
              
              if (onStatusUpdate) {
                onStatusUpdate(tradeStatus);
              }
            }
            break;

          case "error":
            break;

          default:
            break;
        }
      } catch (error) {
        // Silent error handling
      }
    });

    // Handle WebSocket errors
    const unsubscribeError = ws.onError((error) => {
      // Silent error handling
    });

    // Handle WebSocket close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      // Silent close handling
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      // Silent open handling
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
  }, [enabled, tradeId, onStatusUpdate]);

  return {
    isConnected: wsRef.current.isConnected(),
  };
};

