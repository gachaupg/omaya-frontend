import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  updateMatchedTradesFromWS,
  upsertMatchedTradeFromWS,
  removeMatchedTradeFromWS,
  removeMatchedTradeByStatusFromWS,
  fetchLatestMatchedTradesPage,
  fetchMatchedTrades,
} from "../slices/matchedTradesSlice";
import { P2P_TRADE_CANCELED_EVENT } from "../constants/tradeSocketEvents";
import { isTerminalMatchedTradeNotificationStatus } from "../utils/matchedTradeNotifications";
import {
  getMatchedTradesWebSocket,
  WebSocketMessage,
} from "../services/matchedTradesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

import { logger } from '@/lib/utils/logger';

interface UseMatchedTradesWebSocketOptions {
  enabled?: boolean;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

export const useMatchedTradesWebSocket = (
  options: UseMatchedTradesWebSocketOptions = {}
) => {
  const {
    enabled = true,
    fallbackToPolling = true,
    pollingInterval = 30000, // 30 seconds
  } = options;

  const dispatch = useDispatch<AppDispatch>();

  const refreshMatchedTradesFromApi = () => {
    dispatch((_, getState) => {
      const { activePage, totalPages } = (getState() as RootState).matchedTrades;
      if (activePage >= totalPages) {
        dispatch(fetchLatestMatchedTradesPage());
      } else {
        dispatch(fetchMatchedTrades(activePage));
      }
    });
  };
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef(getMatchedTradesWebSocket());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Trade cancel on buy/sell forms uses trade-status / trade-messages sockets — sync bell + notifications.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const onTradeCanceled = (event: Event) => {
      const detail = (event as CustomEvent<{ tradeId?: string }>).detail;
      const tradeId = detail?.tradeId != null ? String(detail.tradeId).trim() : "";
      if (!tradeId || !mountedRef.current) return;
      dispatch(removeMatchedTradeFromWS(tradeId));
    };

    window.addEventListener(P2P_TRADE_CANCELED_EVENT, onTradeCanceled);
    return () => window.removeEventListener(P2P_TRADE_CANCELED_EVENT, onTradeCanceled);
  }, [enabled, dispatch]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const getAccessToken = (): string | null => {
      // First try to get from cookies (primary storage)
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        logger.debug('p2p', "✅ Access token found in cookies");
        return cookieToken;
      }
      
      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          logger.debug('p2p', "✅ Access token found in localStorage");
          return localToken;
        }
      }
      
      return null;
    };

    const token = getAccessToken();

    if (!token) {
      console.warn("⚠️ No access token found, cannot connect to WebSocket");
      console.warn("Checked locations: cookies (access_token), localStorage (access_token)");
      setConnectionError("No access token");
      
      // Fall back to polling if enabled
      if (fallbackToPolling) {
        logger.debug('p2p', "🔄 Falling back to HTTP polling");
        startPolling();
      }
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      console.error("⚠️ Invalid token format (not a JWT)");
      setConnectionError("Invalid token format");
      
      if (fallbackToPolling) {
        logger.debug('p2p', "🔄 Falling back to HTTP polling");
        startPolling();
      }
      return;
    }

    // Token validated - connecting to WebSocket

    const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) return;

      try {
        switch (message.type) {
          case "connection_established":
            setIsConnected(true);
            setConnectionError(null);
            // Stop polling when WebSocket is connected
            stopPolling();
            break;

          case "initial_data":
            if (Array.isArray(message.data?.trades)) {
              dispatch(
                updateMatchedTradesFromWS({
                  trades: message.data.trades,
                  replace: true,
                })
              );
            }
            break;

          case "trades_update":
            if (Array.isArray(message.data?.trades)) {
              dispatch(
                updateMatchedTradesFromWS({
                  trades: message.data.trades,
                  replace: true,
                })
              );
            }
            break;

          case "trade_update": {
            const action = String(message.data?.action ?? "").toLowerCase();
            const tradeId = String(
              message.data?.trade_id ?? message.data?.trade?.id ?? ""
            ).trim();
            const status = String(
              message.data?.status ?? message.data?.trade?.status ?? ""
            );
            const trade = message.data?.trade;

            if (
              action === "deleted" ||
              action === "removed" ||
              action === "cancelled" ||
              action === "canceled"
            ) {
              if (tradeId) dispatch(removeMatchedTradeFromWS(tradeId));
              break;
            }

            if (trade) {
              dispatch(upsertMatchedTradeFromWS(trade));
              break;
            }

            if (tradeId && isTerminalMatchedTradeNotificationStatus(status)) {
              dispatch(
                removeMatchedTradeByStatusFromWS({ tradeId, status })
              );
            }
            break;
          }

          default:
            if (process.env.NODE_ENV === 'development') {
              logger.debug('p2p', "Unknown message type:", message.type);
            }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });

    // Handle WebSocket errors
    const unsubscribeError = ws.onError((error) => {
      setConnectionError("WebSocket connection error");
      
      // Fall back to polling on error if enabled
      if (fallbackToPolling) {
        startPolling();
      }
    });

    // Handle WebSocket close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      
      // Fall back to polling when connection closes if enabled
      if (fallbackToPolling) {
        startPolling();
      }
    });

    // Handle WebSocket open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      setConnectionError(null);
      // Stop polling when WebSocket opens
      stopPolling();
    });

    // Connect to WebSocket
    ws.connect(token);

    // Cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeClose();
      unsubscribeOpen();
      stopPolling();
      ws.disconnect();
    };
  }, [enabled, dispatch, fallbackToPolling]);

  const startPolling = () => {
    // Don't start polling if already running
    if (pollingIntervalRef.current) {
      return;
    }
    
    refreshMatchedTradesFromApi();

    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !wsRef.current.isConnected()) {
        refreshMatchedTradesFromApi();
      }
    }, pollingInterval);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  return {
    isConnected,
    connectionError,
  };
};

