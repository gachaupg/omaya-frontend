import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { store } from "@/store";
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

import { logger } from '@/lib/utils/logger';

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
  const { currentPage } = useSelector(
    (state: RootState) => state.p2pMarket || { currentPage: 1 }
  );
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef(getP2POrdersWebSocket());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update ref whenever currentPage changes - use a callback to ensure immediate update
  useEffect(() => {
    currentPageRef.current = currentPage;
    logger.debug('p2p', "📄 [WS Hook] Updated currentPageRef to:", currentPage);
  }, [currentPage]);

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
          logger.error('p2p', "❌ [Auth] No profile found in localStorage");
          return null;
        }

        const profile = JSON.parse(profileStr);
        const refreshToken = profile?.tokens?.refresh;

        if (!refreshToken) {
          logger.error('p2p', "❌ [Auth] No refresh token found");
          return null;
        }

        logger.debug('p2p', "🔄 [Auth] Refreshing access token...");
        const response = await axios.post(
          `${API_BASE_URL}/api/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = response.data.access;
        logger.debug('p2p', "✅ [Auth] Token refreshed successfully");

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
        logger.debug('p2p', "❌ [Auth] No access token found");
        return null;
      }

      logger.debug('p2p', "✅ [Auth] Access token found");
      logger.debug('p2p', "🔑 [Auth] Token preview:", token.substring(0, 20) + "...");
      logger.debug('p2p', "📏 [Auth] Token length:", token.length);

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

        logger.debug('p2p', "📊 [Auth] Token payload:", {
          exp: payload.exp,
          expiresAt: expiresAt?.toISOString() || 'N/A',
          isExpired,
          user_id: payload.user_id,
        });

        if (isExpired) {
          console.warn("⚠️ [Auth] Token has expired, attempting to refresh...");
          const newToken = await refreshAccessToken();
          if (newToken) {
            logger.debug('p2p', "✅ [Auth] Using refreshed token");
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
          logger.debug('p2p', "🔄 Falling back to HTTP polling for P2P orders");
          startPolling();
        }
        return;
      }

      const ws = wsRef.current;

    // Handle WebSocket messages
    const unsubscribeMessage = ws.onMessage((message: WebSocketMessage) => {
      if (!mountedRef.current) {
        logger.debug('p2p', "⚠️ [WS Hook] Component unmounted, ignoring message");
        return;
      }

      logger.debug('p2p', "📨 [WS Hook] Received WebSocket message:", message);

      try {
        switch (message.type) {
          case "connection_established":
            logger.debug('p2p', "✅ [WS Hook] Connection established, current page:", currentPageRef.current);
            setIsConnected(true);
            setConnectionError(null);
            // Stop polling when WebSocket is connected
            stopPolling();
            // Don't fetch page 1 on reconnect if user is on a different page
            // The initial_data message will handle data loading if needed
            break;

          case "initial_data":
            // Get current page from Redux state directly (most up-to-date)
            const currentPageFromState = store.getState()?.p2pMarket?.currentPage || 1;
            logger.debug('p2p', "📊 [WS Hook] Processing initial_data, current page (ref):", currentPageRef.current, "state:", currentPageFromState);
            // Initial data from WebSocket - full refresh
            // CRITICAL: Only apply if user is on page 1, otherwise skip to preserve pagination
            // This prevents WebSocket from resetting pagination when user is on page 2+
            if (message.data.buy_orders || message.data.sell_orders) {
              // Check current page from both ref and Redux state - if not page 1, completely skip this message
              if (currentPageRef.current !== 1 || currentPageFromState !== 1) {
                logger.debug('p2p', "⏭️ [WS Hook] SKIPPING initial_data - user is on page", currentPageRef.current, "/", currentPageFromState, "- preserving pagination");
                return; // Return early, don't process this message at all
              }
              
              logger.debug('p2p', "📊 [WS Hook] Initial P2P orders from WebSocket", {
                buyOrdersCount: message.data.buy_orders?.length || 0,
                sellOrdersCount: message.data.sell_orders?.length || 0,
                timestamp: message.data.timestamp,
                hasBuyOrders: !!message.data.buy_orders,
                hasSellOrders: !!message.data.sell_orders,
              });
              
              logger.debug('p2p', "🚀 [WS Hook] Dispatching updateOrdersFromWS with initial data");
              dispatch(
                updateOrdersFromWS({
                  buy_orders: message.data.buy_orders || [],
                  sell_orders: message.data.sell_orders || [],
                  pagination: message.data.pagination,
                  full_refresh: true, // Full refresh for initial data
                })
              );
              logger.debug('p2p', "✅ [WS Hook] Dispatched initial data to Redux");
            } else {
              console.warn("⚠️ [WS Hook] initial_data message has no buy_orders or sell_orders");
            }
            break;

          case "orders_update":
            // Get current page from Redux state directly (most up-to-date)
            const currentPageFromStateUpdate = store.getState()?.p2pMarket?.currentPage || 1;
            logger.debug('p2p', "🔄 [WS Hook] Processing orders_update, current page (ref):", currentPageRef.current, "state:", currentPageFromStateUpdate);
            // Incremental update from WebSocket - merge with existing
            if (message.data.buy_orders || message.data.sell_orders) {
              // CRITICAL: Skip full_refresh updates if user is not on page 1
              // This prevents WebSocket from resetting pagination when user is on page 2+
              // Check both ref and Redux state to ensure we have the latest page
              if (message.data.full_refresh && (currentPageRef.current !== 1 || currentPageFromStateUpdate !== 1)) {
                logger.debug('p2p', "⏭️ [WS Hook] SKIPPING orders_update full_refresh - user is on page", currentPageRef.current, "/", currentPageFromStateUpdate, "- preserving pagination");
                return; // Return early, don't process this message at all
              }
              
              logger.debug('p2p', "🔄 [WS Hook] Incremental P2P orders update from WebSocket", {
                buyOrdersCount: message.data.buy_orders?.length || 0,
                sellOrdersCount: message.data.sell_orders?.length || 0,
                timestamp: message.data.timestamp,
                fullRefresh: message.data.full_refresh,
                hasBuyOrders: !!message.data.buy_orders,
                hasSellOrders: !!message.data.sell_orders,
                currentPage: currentPageRef.current,
              });
              
              logger.debug('p2p', "🚀 [WS Hook] Dispatching updateOrdersFromWS with update");
              dispatch(
                updateOrdersFromWS({
                  buy_orders: message.data.buy_orders || [],
                  sell_orders: message.data.sell_orders || [],
                  pagination: message.data.pagination,
                  full_refresh: message.data.full_refresh || false, // Use backend's full_refresh flag
                })
              );
              logger.debug('p2p', "✅ [WS Hook] Dispatched update to Redux");
            } else {
              console.warn("⚠️ [WS Hook] orders_update message has no buy_orders or sell_orders");
            }
            break;

          case "pong":
            // Pong response - connection is alive, silently ignore
            logger.debug('p2p', "💓 [WS Hook] Received pong heartbeat");
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
          logger.debug('p2p', "🔄 [WS Hook] Falling back to HTTP polling due to auth failure");
          startPolling();
          return;
        }
        
        // Fall back to polling when connection closes if enabled
        if (fallbackToPolling) {
          logger.debug('p2p', "🔄 [WS Hook] Falling back to HTTP polling");
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
      logger.debug('p2p', "🔄 Starting HTTP polling for P2P orders");
    }
    
    // DISABLED: Don't auto-fetch on polling start - only fetch if on page 1
    // This prevents overwriting pagination when user is on other pages
    const currentPageFromState = store.getState()?.p2pMarket?.currentPage || 1;
    if (currentPageFromState === 1 && currentPageRef.current === 1) {
      console.log('📡 [WS Hook] Polling: Fetching page 1');
      dispatch(fetchAllP2PBuyandSell(1));
    } else {
      console.log('📡 [WS Hook] Polling: Skipping fetch - user on page', currentPageFromState);
    }

    // Then set up interval - only poll if on page 1
    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !wsRef.current.isConnected()) {
        const pageInState = store.getState()?.p2pMarket?.currentPage || 1;
        if (pageInState === 1) {
          console.log('📡 [WS Hook] Polling interval: Fetching page 1');
          dispatch(fetchAllP2PBuyandSell(1));
        } else {
          console.log('📡 [WS Hook] Polling interval: Skipping - user on page', pageInState);
        }
      }
    }, pollingInterval);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('p2p', "⏹️ Stopping HTTP polling for P2P orders");
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

