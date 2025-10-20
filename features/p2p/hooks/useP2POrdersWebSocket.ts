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
import { API_BASE_URL } from "@/config/api";
import axios from "axios";

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

    // Function to refresh the access token
    const refreshAccessToken = async (): Promise<string | null> => {
      try {
        // Get refresh token from localStorage
        const profileStr = localStorage.getItem("profile");
        if (!profileStr) {
          return null;
        }

        const profile = JSON.parse(profileStr);
        const refreshToken = profile?.tokens?.refresh;

        if (!refreshToken) {
          return null;
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = response.data.access;

        // Update profile in localStorage
        profile.tokens.access = newAccessToken;
        localStorage.setItem("profile", JSON.stringify(profile));

        // Update cookie
        cookieUtils.setCookie("access_token", newAccessToken, {
          maxAge: 86400,
          secure: true,
          sameSite: "strict",
        });

        // Also update standalone token in localStorage for backward compatibility
        localStorage.setItem("access_token", newAccessToken);

        return newAccessToken;
      } catch (error) {
        // Redirect to login if refresh fails
        if (typeof window !== "undefined") {
          localStorage.removeItem("profile");
          localStorage.removeItem("access_token");
          cookieUtils.removeCookie("access_token");
          window.location.href = "/auth/login";
        }
        return null;
      }
    };

    const getAccessToken = async (): Promise<string | null> => {
      // First try to get from cookies (primary storage)
      let token = cookieUtils.getCookie("access_token");

      if (!token && typeof window !== "undefined") {
        // Fallback to localStorage
        token = localStorage.getItem("access_token");
      }

      if (!token) {
        return null;
      }

      // Validate JWT structure
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        return null;
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
        const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;

        if (isExpired) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return newToken;
          }
          return null;
        }
      } catch (e) {}

      return token;
    };

    // Make the effect async-compatible
    const initializeWebSocket = async () => {
      const token = await getAccessToken();

      if (!token) {
        setConnectionError("No access token");

        // Fall back to polling if enabled
        if (fallbackToPolling) {
          startPolling();
        }
        return;
      }

      const ws = wsRef.current;

      // Handle WebSocket messages
      const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
        if (!mountedRef.current) {
          return;
        }

        try {
          switch (message.type) {
            case "connection_established":
              setIsConnected(true);
              setConnectionError(null);
              // Stop polling when WebSocket is connected
              stopPolling();
              break;

            case "initial_data":
              // Initial data from WebSocket - full refresh
              if (message.data.buy_orders || message.data.sell_orders) {
                dispatch(
                  updateOrdersFromWS({
                    buy_orders: message.data.buy_orders || [],
                    sell_orders: message.data.sell_orders || [],
                    pagination: message.data.pagination,
                    full_refresh: true, // Full refresh for initial data
                  })
                );
              } else {
              }
              break;

            case "orders_update":
              // Incremental update from WebSocket - merge with existing
              if (message.data.buy_orders || message.data.sell_orders) {
                dispatch(
                  updateOrdersFromWS({
                    buy_orders: message.data.buy_orders || [],
                    sell_orders: message.data.sell_orders || [],
                    pagination: message.data.pagination,
                    full_refresh: message.data.full_refresh || false, // Use backend's full_refresh flag
                  })
                );
              } else {
              }
              break;

            case "error":
              setConnectionError(message.data.message || "WebSocket error");
              break;

            default:
          }
        } catch (error) {}
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
      const unsubscribeClose = ws.onClose((event?: CloseEvent) => {
        if (!mountedRef.current) return;
        setIsConnected(false);

        // Check if it's a 4003 (Forbidden) error
        if (event && event.code === 4003) {
         
          setConnectionError("Authentication failed (4003)");

          // ALWAYS fall back to polling on auth errors
          startPolling();
          return;
        }

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
    };

    // Call the async initialization
    initializeWebSocket();
  }, [enabled, dispatch, fallbackToPolling]);

  const startPolling = () => {
    // Don't start polling if already running
    if (pollingIntervalRef.current) {
      return;
    }

    if (process.env.NODE_ENV === "development") {
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
      if (process.env.NODE_ENV === "development") {
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
