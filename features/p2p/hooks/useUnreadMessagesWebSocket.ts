import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  getUnreadMessagesWebSocket,
  RecentMessage,
  WebSocketMessage,
} from "../services/unreadMessagesWebSocket";
import { updateUnreadCount, setRecentMessages } from "../slices/unreadMessagesSlice";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";

interface UseUnreadMessagesWebSocketOptions {
  enabled?: boolean;
  onNewMessage?: (count: number) => void;
  onRecentMessages?: (messages: RecentMessage[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Hook for managing unread messages WebSocket connection
 *
 * @param options Configuration options
 * @returns Connection state and control functions
 */
export const useUnreadMessagesWebSocket = (
  options: UseUnreadMessagesWebSocketOptions = {}
) => {
  const {
    enabled = true,
    onNewMessage,
    onRecentMessages,
    onConnectionChange,
  } = options;
  const dispatch = useDispatch<AppDispatch>();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef(getUnreadMessagesWebSocket());
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
        logger.debug("unread-messages", "✅ Access token found in cookies");
        return cookieToken;
      }

      // Fallback to localStorage (for backward compatibility)
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) {
          logger.debug("unread-messages", "✅ Access token found in localStorage");
          return localToken;
        }
      }

      return null;
    };

    const token = getAccessToken();

    if (!token) {
      logger.warn("unread-messages", "⚠️ No access token found, cannot connect to WebSocket");
      logger.warn("unread-messages", "Checked locations: cookies (access_token), localStorage (access_token)");
      setConnectionError("No access token");
      return;
    }

    // Validate token format (basic check)
    if (!token.includes(".")) {
      logger.error("unread-messages", "⚠️ Invalid token format (not a JWT)");
      setConnectionError("Invalid token format");
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
            if (onConnectionChange) {
              onConnectionChange(true);
            }
            logger.debug("unread-messages", "Connection established:", {
              connection_id: message.data.connection_id,
              user_id: message.data.user_id,
            });
            break;

          case "recent_messages":
            const count = message.data?.count ?? 0;
            const recentMessagesList = message.data?.messages ?? [];
            logger.debug("unread-messages", "Received unread messages update:", {
              count,
              messagesLength: recentMessagesList.length,
            });

            // Update Redux store with the count and recent messages
            dispatch(updateUnreadCount(count));
            dispatch(setRecentMessages(recentMessagesList));

            // Call optional callback
            if (onNewMessage) {
              onNewMessage(count);
            }
            if (onRecentMessages) {
              onRecentMessages(recentMessagesList);
            }
            break;

          case "error":
            logger.error("unread-messages", "WebSocket error:", message.data);
            setConnectionError(message.data.message || "WebSocket error");
            break;

          default:
            if (process.env.NODE_ENV === "development") {
              logger.debug("unread-messages", "Unknown message type:", message.type);
            }
        }
      } catch (error) {
        logger.error("unread-messages", "Error handling WebSocket message:", error);
      }
    });

    // Handle connection open
    const unsubscribeOpen = ws.onOpen(() => {
      if (!mountedRef.current) return;
      logger.debug("unread-messages", "WebSocket connected");
      setIsConnected(true);
      setConnectionError(null);
      if (onConnectionChange) {
        onConnectionChange(true);
      }
    });

    // Handle connection close
    const unsubscribeClose = ws.onClose(() => {
      if (!mountedRef.current) return;
      logger.debug("unread-messages", "WebSocket disconnected");
      setIsConnected(false);
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    });

    // Handle connection errors
    const unsubscribeError = ws.onError((error) => {
      if (!mountedRef.current) return;
      logger.error("unread-messages", "WebSocket error event:", error);
      setConnectionError("Connection error");
    });

    // Connect to WebSocket
    logger.debug("unread-messages", "🔌 Connecting to unread messages WebSocket...");
    ws.connect({ token });

    // Cleanup on unmount
    return () => {
      logger.debug("unread-messages", "🧹 Cleaning up WebSocket connection");
      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [enabled, dispatch, onNewMessage, onRecentMessages, onConnectionChange]);

  return {
    isConnected,
    connectionError,
    reconnect: () => {
      logger.debug("unread-messages", "Reconnecting WebSocket");
      const token = cookieUtils.getCookie("access_token") || localStorage.getItem("access_token");
      if (token) {
        wsRef.current.connect({ token });
      }
    },
  };
};
