import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  updateMatchedTradesFromWS,
  addMatchedTradeFromWS,
  updateSingleTradeFromWS,
  fetchMatchedTrades,
} from "../slices/matchedTradesSlice";
import {
  getMatchedTradesWebSocket,
  WebSocketMessage,
} from "../services/matchedTradesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const getAccessToken = (): string | null => {
      // First try to get from cookies (primary storage)
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) {
        console.log("✅ Access token found in cookies");
        return cookieToken;
      }
      
      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          console.log("✅ Access token found in localStorage");
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
        console.log("🔄 Falling back to HTTP polling");
        startPolling();
      }
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      console.error("⚠️ Invalid token format (not a JWT)");
      setConnectionError("Invalid token format");
      
      if (fallbackToPolling) {
        console.log("🔄 Falling back to HTTP polling");
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
            if (message.data.trades) {
              dispatch(
                updateMatchedTradesFromWS({
                  trades: message.data.trades,
                  count: message.data.count,
                })
              );
            }
            break;

          case "trades_update":
            // Silent update - data will be logged by UserCard if needed
            if (message.data.trades) {
              dispatch(
                updateMatchedTradesFromWS({
                  trades: message.data.trades,
                  count: message.data.count,
                })
              );
            }
            break;

          case "trade_update":
            if (message.data.trade) {
              if (message.data.action === "created") {
                dispatch(addMatchedTradeFromWS(message.data.trade));
              } else {
                dispatch(updateSingleTradeFromWS(message.data.trade));
              }
            }
            break;

          default:
            if (process.env.NODE_ENV === 'development') {
              console.log("Unknown message type:", message.type);
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
    
    // Fetch immediately
    dispatch(fetchMatchedTrades(1));

    // Then set up interval
    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !wsRef.current.isConnected()) {
        dispatch(fetchMatchedTrades(1));
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

