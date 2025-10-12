import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  updateOrdersFromWS,
  fetchAllP2PBuyandSell,
} from "../slices/orderSlice";
import {
  getP2POrdersWebSocket,
  WebSocketMessage,
} from "../services/p2pOrdersWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

interface UseP2POrdersWebSocketOptions {
  enabled?: boolean;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

export const useP2POrdersWebSocket = (
  options: UseP2POrdersWebSocketOptions = {}
) => {
  const {
    enabled = true,
    fallbackToPolling = true,
    pollingInterval = 30000, // 30 seconds
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef(getP2POrdersWebSocket());
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
      console.warn("⚠️ No access token found, cannot connect to P2P Orders WebSocket");
      console.warn("Checked locations: cookies (access_token), localStorage (access_token)");
      setConnectionError("No access token");
      
      // Fall back to polling if enabled
      if (fallbackToPolling) {
        console.log("🔄 Falling back to HTTP polling for P2P orders");
        startPolling();
      }
      return;
    }

    // Validate token format (basic check)
    if (!token.includes('.')) {
      console.error("⚠️ Invalid token format (not a JWT)");
      setConnectionError("Invalid token format");
      
      if (fallbackToPolling) {
        console.log("🔄 Falling back to HTTP polling for P2P orders");
        startPolling();
      }
      return;
    }

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
            if (process.env.NODE_ENV === 'development') {
              console.log("🎉 P2P Orders WebSocket connection established");
            }
            break;

          case "initial_data":
            // Initial data from WebSocket - full refresh
            if (message.data.buy_orders || message.data.sell_orders) {
              if (process.env.NODE_ENV === 'development') {
                console.log("📊 Initial P2P orders from WebSocket", {
                  buyOrdersCount: message.data.buy_orders?.length || 0,
                  sellOrdersCount: message.data.sell_orders?.length || 0,
                  timestamp: message.data.timestamp,
                });
              }
              
              dispatch(
                updateOrdersFromWS({
                  buy_orders: message.data.buy_orders || [],
                  sell_orders: message.data.sell_orders || [],
                  pagination: message.data.pagination,
                  full_refresh: true, // Full refresh for initial data
                })
              );
            }
            break;

          case "orders_update":
            // Incremental update from WebSocket - merge with existing
            if (message.data.buy_orders || message.data.sell_orders) {
              if (process.env.NODE_ENV === 'development') {
                console.log("🔄 Incremental P2P orders update from WebSocket", {
                  buyOrdersCount: message.data.buy_orders?.length || 0,
                  sellOrdersCount: message.data.sell_orders?.length || 0,
                  timestamp: message.data.timestamp,
                  fullRefresh: message.data.full_refresh,
                });
              }
              
              dispatch(
                updateOrdersFromWS({
                  buy_orders: message.data.buy_orders || [],
                  sell_orders: message.data.sell_orders || [],
                  pagination: message.data.pagination,
                  full_refresh: message.data.full_refresh || false, // Use backend's full_refresh flag
                })
              );
            }
            break;

          case "error":
            console.error("❌ P2P Orders WebSocket error:", message.data.message);
            setConnectionError(message.data.message || "WebSocket error");
            break;

          default:
            if (process.env.NODE_ENV === 'development') {
              console.log("Unknown P2P Orders message type:", message.type);
            }
        }
      } catch (error) {
        console.error("Error handling P2P Orders WebSocket message:", error);
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 Starting HTTP polling for P2P orders");
    }
    
    // Fetch immediately
    dispatch(fetchAllP2PBuyandSell(1));

    // Then set up interval
    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !wsRef.current.isConnected()) {
        dispatch(fetchAllP2PBuyandSell(1));
      }
    }, pollingInterval);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log("⏹️ Stopping HTTP polling for P2P orders");
      }
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  return {
    isConnected,
    connectionError,
  };
};

