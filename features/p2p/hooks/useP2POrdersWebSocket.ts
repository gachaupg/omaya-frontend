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
          console.error("❌ [Auth] No profile found in localStorage");
          return null;
        }

        const profile = JSON.parse(profileStr);
        const refreshToken = profile?.tokens?.refresh;

        if (!refreshToken) {
          console.error("❌ [Auth] No refresh token found");
          return null;
        }

        console.log("🔄 [Auth] Refreshing access token...");
        const response = await axios.post(
          `${API_BASE_URL}/api/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = response.data.access;
        console.log("✅ [Auth] Token refreshed successfully");

        // Update profile in localStorage
        profile.tokens.access = newAccessToken;
        localStorage.setItem("profile", JSON.stringify(profile));

        // Update cookie
        cookieUtils.setCookie("access_token", newAccessToken, {
          maxAge: 86400,
          secure: true,
          sameSite: 'strict'
        });

        // Also update standalone token in localStorage for backward compatibility
        localStorage.setItem("access_token", newAccessToken);

        return newAccessToken;
      } catch (error) {
        console.error("❌ [Auth] Token refresh failed:", error);
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
        console.log("❌ [Auth] No access token found");
        return null;
      }

      console.log("✅ [Auth] Access token found");
      console.log("🔑 [Auth] Token preview:", token.substring(0, 20) + "...");
      console.log("📏 [Auth] Token length:", token.length);

      // Validate JWT structure
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("⚠️ [Auth] Invalid JWT structure");
        return null;
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
        const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;

        console.log("📊 [Auth] Token payload:", {
          exp: payload.exp,
          expiresAt: expiresAt?.toISOString() || 'N/A',
          isExpired,
          user_id: payload.user_id,
        });

        if (isExpired) {
          console.warn("⚠️ [Auth] Token has expired, attempting to refresh...");
          const newToken = await refreshAccessToken();
          if (newToken) {
            console.log("✅ [Auth] Using refreshed token");
            return newToken;
          }
          console.error("❌ [Auth] Token refresh failed");
          return null;
        }
      } catch (e) {
        console.warn("⚠️ [Auth] Could not decode token payload:", e);
      }

      return token;
    };

    // Make the effect async-compatible
    const initializeWebSocket = async () => {
      const token = await getAccessToken();

      if (!token) {
        console.warn("⚠️ [Auth] No access token available, cannot connect to P2P Orders WebSocket");
        setConnectionError("No access token");
        
        // Fall back to polling if enabled
        if (fallbackToPolling) {
          console.log("🔄 Falling back to HTTP polling for P2P orders");
          startPolling();
        }
        return;
      }

      const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) {
        console.log("⚠️ [WS Hook] Component unmounted, ignoring message");
        return;
      }

      console.log("📨 [WS Hook] Received WebSocket message:", message);

      try {
        switch (message.type) {
          case "connection_established":
            console.log("✅ [WS Hook] Connection established");
            setIsConnected(true);
            setConnectionError(null);
            // Stop polling when WebSocket is connected
            stopPolling();
            break;

          case "initial_data":
            console.log("📊 [WS Hook] Processing initial_data");
            // Initial data from WebSocket - full refresh
            if (message.data.buy_orders || message.data.sell_orders) {
              console.log("📊 [WS Hook] Initial P2P orders from WebSocket", {
                buyOrdersCount: message.data.buy_orders?.length || 0,
                sellOrdersCount: message.data.sell_orders?.length || 0,
                timestamp: message.data.timestamp,
                hasBuyOrders: !!message.data.buy_orders,
                hasSellOrders: !!message.data.sell_orders,
              });
              
              console.log("🚀 [WS Hook] Dispatching updateOrdersFromWS with initial data");
              dispatch(
                updateOrdersFromWS({
                  buy_orders: message.data.buy_orders || [],
                  sell_orders: message.data.sell_orders || [],
                  pagination: message.data.pagination,
                  full_refresh: true, // Full refresh for initial data
                })
              );
              console.log("✅ [WS Hook] Dispatched initial data to Redux");
            } else {
              console.warn("⚠️ [WS Hook] initial_data message has no buy_orders or sell_orders");
            }
            break;

          case "orders_update":
            console.log("🔄 [WS Hook] Processing orders_update");
            // Incremental update from WebSocket - merge with existing
            if (message.data.buy_orders || message.data.sell_orders) {
              console.log("🔄 [WS Hook] Incremental P2P orders update from WebSocket", {
                buyOrdersCount: message.data.buy_orders?.length || 0,
                sellOrdersCount: message.data.sell_orders?.length || 0,
                timestamp: message.data.timestamp,
                fullRefresh: message.data.full_refresh,
                hasBuyOrders: !!message.data.buy_orders,
                hasSellOrders: !!message.data.sell_orders,
              });
              
              console.log("🚀 [WS Hook] Dispatching updateOrdersFromWS with update");
              dispatch(
                updateOrdersFromWS({
                  buy_orders: message.data.buy_orders || [],
                  sell_orders: message.data.sell_orders || [],
                  pagination: message.data.pagination,
                  full_refresh: message.data.full_refresh || false, // Use backend's full_refresh flag
                })
              );
              console.log("✅ [WS Hook] Dispatched update to Redux");
            } else {
              console.warn("⚠️ [WS Hook] orders_update message has no buy_orders or sell_orders");
            }
            break;

          case "error":
            console.error("❌ [WS Hook] P2P Orders WebSocket error:", message.data.message);
            setConnectionError(message.data.message || "WebSocket error");
            break;

          default:
            console.warn("⚠️ [WS Hook] Unknown P2P Orders message type:", message.type);
            console.warn("📄 [WS Hook] Full message:", message);
        }
      } catch (error) {
        console.error("❌ [WS Hook] Error handling P2P Orders WebSocket message:", error);
        console.error("📄 [WS Hook] Message that caused error:", message);
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
      const unsubscribeClose = ws.onClose((event?: CloseEvent) => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        
        // Check if it's a 4003 (Forbidden) error
        if (event && event.code === 4003) {
          console.error("🚫 [WS Hook] WebSocket closed with 4003 (Forbidden) - Authentication failed");
          console.error("💡 [WS Hook] This usually means:");
          console.error("   1. Token is invalid or expired");
          console.error("   2. Backend WebSocket authentication is failing");
          console.error("   3. Token format doesn't match backend expectations");
          setConnectionError("Authentication failed (4003)");
          
          // ALWAYS fall back to polling on auth errors
          console.log("🔄 [WS Hook] Falling back to HTTP polling due to auth failure");
          startPolling();
          return;
        }
        
        // Fall back to polling when connection closes if enabled
        if (fallbackToPolling) {
          console.log("🔄 [WS Hook] Falling back to HTTP polling");
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

